"use client";
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { apiRequest, GUEST_CART_KEY, resolveAssetUrl } from "@/lib/api-client";
import { getStoredToken } from "@/lib/auth-client";
const CartContext = createContext(undefined);
function safeParse(raw) {
    if (!raw)
        return null;
    try {
        return JSON.parse(raw);
    }
    catch {
        return null;
    }
}
function mapProductAssets(product) {
    if (!product)
        return undefined;
    return {
        ...product,
        image: resolveAssetUrl(product.image),
        images: (product.images || []).map((item) => resolveAssetUrl(item)),
    };
}
function normalizeGuestItems(rawItems) {
    if (!Array.isArray(rawItems))
        return [];
    const normalized = [];
    for (const item of rawItems) {
        const productId = typeof item?.productId === "string"
            ? item.productId
            : typeof item?.product?.id === "string"
                ? item.product.id
                : "";
        if (!productId)
            continue;
        const quantity = Math.max(1, Math.floor(Number(item?.quantity || 1)));
        const product = mapProductAssets(item?.product);
        normalized.push(product
            ? {
                productId,
                quantity,
                product,
            }
            : {
                productId,
                quantity,
            });
    }
    return normalized;
}
function persistGuestItems(items) {
    if (typeof window === "undefined")
        return;
    window.localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items));
}
export function CartProvider({ children }) {
    const [items, setItems] = useState([]);
    const [serverSubtotal, setServerSubtotal] = useState(null);
    const [serverTotal, setServerTotal] = useState(null);
    const loadGuestCart = () => {
        if (typeof window === "undefined")
            return [];
        const parsed = safeParse(window.localStorage.getItem(GUEST_CART_KEY));
        const normalized = normalizeGuestItems(parsed);
        setItems(normalized);
        setServerSubtotal(null);
        setServerTotal(null);
        return normalized;
    };
    const applyServerCart = (payload) => {
        const normalized = (payload.items || []).map((item) => ({
            productId: item.productId,
            quantity: Math.max(1, Math.floor(Number(item.quantity || 1))),
            product: mapProductAssets(item.product),
        }));
        setItems(normalized);
        setServerSubtotal(Number(payload.subtotal || 0));
        setServerTotal(Number(payload.total || 0));
    };
    const refreshCart = async () => {
        const token = getStoredToken();
        if (!token) {
            loadGuestCart();
            return;
        }
        const guestItems = loadGuestCart();
        if (guestItems.length > 0) {
            const syncPayload = await apiRequest("/cart/sync", {
                method: "POST",
                withAuth: true,
                body: JSON.stringify({
                    items: guestItems.map((item) => ({
                        productId: item.productId,
                        quantity: item.quantity,
                    })),
                }),
            });
            applyServerCart(syncPayload);
            if (typeof window !== "undefined") {
                window.localStorage.removeItem(GUEST_CART_KEY);
            }
            return;
        }
        const payload = await apiRequest("/cart", {
            method: "GET",
            withAuth: true,
        });
        applyServerCart(payload);
    };
    useEffect(() => {
        let cancelled = false;
        const bootstrap = async () => {
            try {
                await refreshCart();
            }
            catch {
                if (!cancelled) {
                    loadGuestCart();
                }
            }
        };
        bootstrap();
        const handleAuthChanged = () => {
            refreshCart().catch(() => {
                loadGuestCart();
            });
        };
        window.addEventListener("auth-changed", handleAuthChanged);
        return () => {
            cancelled = true;
            window.removeEventListener("auth-changed", handleAuthChanged);
        };
    }, []);
    const addItem = (product, quantity) => {
        const safeQuantity = Math.max(1, Math.floor(quantity));
        const token = getStoredToken();
        if (!token) {
            setItems((prevItems) => {
                const existingItem = prevItems.find((item) => item.productId === product.id);
                const next = existingItem
                    ? prevItems.map((item) => item.productId === product.id
                        ? {
                            ...item,
                            quantity: item.quantity + safeQuantity,
                            product: mapProductAssets(product),
                        }
                        : item)
                    : [
                        ...prevItems,
                        {
                            productId: product.id,
                            quantity: safeQuantity,
                            product: mapProductAssets(product),
                        },
                    ];
                persistGuestItems(next);
                return next;
            });
            return;
        }
        apiRequest("/cart/items", {
            method: "POST",
            withAuth: true,
            body: JSON.stringify({
                productId: product.id,
                quantity: safeQuantity,
            }),
        })
            .then((payload) => {
            applyServerCart(payload);
        })
            .catch(() => {
            // Keep previous UI state on error.
        });
    };
    const removeItem = (productId) => {
        const token = getStoredToken();
        if (!token) {
            setItems((prevItems) => {
                const next = prevItems.filter((item) => item.productId !== productId);
                persistGuestItems(next);
                return next;
            });
            return;
        }
        apiRequest(`/cart/items/${productId}`, {
            method: "DELETE",
            withAuth: true,
        })
            .then((payload) => {
            applyServerCart(payload);
        })
            .catch(() => {
            // Keep previous UI state on error.
        });
    };
    const updateQuantity = (productId, quantity) => {
        if (quantity < 1) {
            removeItem(productId);
            return;
        }
        const token = getStoredToken();
        if (!token) {
            setItems((prevItems) => {
                const next = prevItems.map((item) => item.productId === productId ? { ...item, quantity } : item);
                persistGuestItems(next);
                return next;
            });
            return;
        }
        apiRequest(`/cart/items/${productId}`, {
            method: "PATCH",
            withAuth: true,
            body: JSON.stringify({ quantity }),
        })
            .then((payload) => {
            applyServerCart(payload);
        })
            .catch(() => {
            // Keep previous UI state on error.
        });
    };
    const clearCart = () => {
        const token = getStoredToken();
        if (!token) {
            setItems([]);
            if (typeof window !== "undefined") {
                window.localStorage.removeItem(GUEST_CART_KEY);
            }
            return;
        }
        apiRequest("/cart/clear", {
            method: "DELETE",
            withAuth: true,
        })
            .then((payload) => {
            applyServerCart(payload);
        })
            .catch(() => {
            // Keep previous UI state on error.
        });
    };
    const computedSubtotal = items.reduce((sum, item) => sum + (item.product?.price ?? 0) * item.quantity, 0);
    const subtotal = serverSubtotal ?? computedSubtotal;
    const shipping = subtotal > 5000 ? 0 : 200;
    const total = serverTotal ?? subtotal + shipping;
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
    const value = useMemo(() => ({
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        total,
        subtotal,
        itemCount,
        refreshCart,
    }), [items, total, subtotal, itemCount]);
    return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
export function useCart() {
    const context = useContext(CartContext);
    if (context === undefined) {
        throw new Error("useCart must be used within CartProvider");
    }
    return context;
}
