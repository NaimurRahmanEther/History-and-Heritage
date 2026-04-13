import { apiRequest, AUTH_TOKEN_KEY, AUTH_USER_KEY } from "@/lib/api-client";
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
export function getStoredUser() {
    if (typeof window === "undefined")
        return null;
    return safeParse(window.localStorage.getItem(AUTH_USER_KEY));
}
export function getStoredToken() {
    if (typeof window === "undefined")
        return "";
    return window.localStorage.getItem(AUTH_TOKEN_KEY) || "";
}
export function notifyAuthChanged() {
    if (typeof window === "undefined")
        return;
    window.dispatchEvent(new Event("auth-changed"));
}
export function saveSession(payload) {
    if (typeof window === "undefined")
        return;
    window.localStorage.setItem(AUTH_TOKEN_KEY, payload.token);
    window.localStorage.setItem(AUTH_USER_KEY, JSON.stringify(payload.user));
    notifyAuthChanged();
}
export function clearSession() {
    if (typeof window === "undefined")
        return;
    window.localStorage.removeItem(AUTH_TOKEN_KEY);
    window.localStorage.removeItem(AUTH_USER_KEY);
    notifyAuthChanged();
}
export async function loginUser(email, password) {
    const response = await apiRequest("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
    });
    return {
        token: response.token,
        user: response.user,
    };
}
export async function registerUser(input) {
    const response = await apiRequest("/auth/register", {
        method: "POST",
        body: JSON.stringify(input),
    });
    return {
        token: response.token,
        user: response.user,
    };
}
export async function fetchCurrentUser() {
    const token = getStoredToken();
    if (!token)
        return null;
    try {
        const response = await apiRequest("/auth/me", {
            method: "GET",
            withAuth: true,
        });
        if (typeof window !== "undefined") {
            window.localStorage.setItem(AUTH_USER_KEY, JSON.stringify(response.user));
        }
        return response.user;
    }
    catch {
        clearSession();
        return null;
    }
}
