const DEFAULT_API_BASE_URL = "http://localhost:5000/api";
export const AUTH_TOKEN_KEY = "authToken";
export const AUTH_USER_KEY = "user";
export const GUEST_CART_KEY = "guestCart";
export function getApiBaseUrl() {
    return process.env.NEXT_PUBLIC_API_BASE_URL?.trim() || DEFAULT_API_BASE_URL;
}
export function getBackendOrigin() {
    const baseUrl = getApiBaseUrl().replace(/\/$/, "");
    if (baseUrl.endsWith("/api")) {
        return baseUrl.slice(0, -4);
    }
    return baseUrl;
}
export function resolveAssetUrl(input) {
    if (!input)
        return "";
    if (input.startsWith("http://") || input.startsWith("https://"))
        return input;
    if (input.startsWith("/uploads/")) {
        return `${getBackendOrigin()}${input}`;
    }
    return input;
}
function getStoredToken() {
    if (typeof window === "undefined")
        return "";
    return window.localStorage.getItem(AUTH_TOKEN_KEY) || "";
}
export class ApiError extends Error {
    status;
    constructor(message, status) {
        super(message);
        this.name = "ApiError";
        this.status = status;
    }
}
export async function apiRequest(path, options = {}) {
    const { withAuth = false, headers, ...rest } = options;
    const requestHeaders = new Headers(headers || {});
    if (!requestHeaders.has("Content-Type") && rest.body && !(rest.body instanceof FormData)) {
        requestHeaders.set("Content-Type", "application/json");
    }
    if (withAuth) {
        const token = getStoredToken();
        if (token) {
            requestHeaders.set("Authorization", `Bearer ${token}`);
        }
    }
    const response = await fetch(`${getApiBaseUrl()}${path}`, {
        ...rest,
        headers: requestHeaders,
    });
    const contentType = response.headers.get("content-type") || "";
    const isJson = contentType.includes("application/json");
    const body = isJson ? await response.json() : null;
    if (!response.ok) {
        const message = body?.message || `Request failed with status ${response.status}`;
        throw new ApiError(message, response.status);
    }
    return body;
}
