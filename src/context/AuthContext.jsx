import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { loginPublic } from "../lib/api/adminApi";
import { clearTokens, getAccessToken, getStoredRoles, setTokens } from "../lib/api/tokenStorage";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [accessToken, setAccessTokenState] = useState(() => getAccessToken());
  const [roles, setRolesState] = useState(() => getStoredRoles());

  const login = useCallback(async (username, password) => {
    const res = await loginPublic({ username, password });
    const token = res.accessToken ?? res.access_token;
    if (!token) {
      throw new Error("Login response did not include an access token.");
    }
    const refresh = res.refreshToken ?? res.refresh_token;
    const roleList = (res.roles || []).map((r) => String(r).toUpperCase());
    if (!roleList.includes("ADMIN")) {
      throw new Error("This account does not have ADMIN access.");
    }
    setTokens(token, refresh, roleList);
    setAccessTokenState(token);
    setRolesState(roleList);
  }, []);

  const logout = useCallback(() => {
    clearTokens();
    setAccessTokenState(null);
    setRolesState([]);
  }, []);

  useEffect(() => {
    const sync = () => setAccessTokenState(getAccessToken());
    window.addEventListener("p4u-admin-token-updated", sync);
    return () => window.removeEventListener("p4u-admin-token-updated", sync);
  }, []);

  const value = useMemo(
    () => ({
      isAuthenticated: Boolean(accessToken),
      roles,
      login,
      logout,
    }),
    [accessToken, roles, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
