const TOKEN_KEY = "leadflow-auth-token";
const AUTH_CHANGE_EVENT = "leadflow-auth-change";

export function setAuthToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
  window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
}

export function getAuthToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function clearAuthToken(): void {
  localStorage.removeItem(TOKEN_KEY);
  window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
}

export function hasAuthToken(): boolean {
  return Boolean(getAuthToken());
}

export function subscribeToAuthChanges(callback: () => void): () => void {
  window.addEventListener(AUTH_CHANGE_EVENT, callback);
  return () => window.removeEventListener(AUTH_CHANGE_EVENT, callback);
}
