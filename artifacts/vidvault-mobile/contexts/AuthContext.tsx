import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { Platform } from "react-native";

const TOKEN_KEY = "vidvault_session_token";
const USER_KEY = "vidvault_user";

interface AuthUser {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, firstName?: string, lastName?: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

async function secureGet(key: string): Promise<string | null> {
  if (Platform.OS === "web") {
    try {
      return typeof window !== "undefined" ? window.localStorage.getItem(key) : null;
    } catch {
      return null;
    }
  }
  const SecureStore = await import("expo-secure-store");
  return SecureStore.getItemAsync(key);
}

async function secureSet(key: string, value: string): Promise<void> {
  if (Platform.OS === "web") {
    try {
      if (typeof window !== "undefined") window.localStorage.setItem(key, value);
    } catch { /* ignore */ }
    return;
  }
  const SecureStore = await import("expo-secure-store");
  return SecureStore.setItemAsync(key, value);
}

async function secureDelete(key: string): Promise<void> {
  if (Platform.OS === "web") {
    try {
      if (typeof window !== "undefined") window.localStorage.removeItem(key);
    } catch { /* ignore */ }
    return;
  }
  const SecureStore = await import("expo-secure-store");
  return SecureStore.deleteItemAsync(key);
}

const BASE_URL = `https://${process.env.EXPO_PUBLIC_DOMAIN}`;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const storedToken = await secureGet(TOKEN_KEY);
        const storedUser = await secureGet(USER_KEY);
        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
        }
      } catch {
        // Ignore load errors
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await fetch(`${BASE_URL}/api/login-manual`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error((data as { error?: string }).error || "Login failed");
    }
    const data = (await res.json()) as { sessionId: string; user: AuthUser };

    await secureSet(TOKEN_KEY, data.sessionId);
    setToken(data.sessionId);

    const authUser: AuthUser = {
      id: data.user.id,
      email: data.user.email,
      firstName: data.user.firstName || null,
      lastName: data.user.lastName || null,
      profileImageUrl: data.user.profileImageUrl || null,
    };
    await secureSet(USER_KEY, JSON.stringify(authUser));
    setUser(authUser);
  }, []);

  const register = useCallback(async (email: string, password: string, firstName?: string, lastName?: string) => {
    const res = await fetch(`${BASE_URL}/api/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, firstName, lastName }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error((data as { error?: string }).error || "Registration failed");
    }
    const data = (await res.json()) as { sessionId: string; user: AuthUser };

    await secureSet(TOKEN_KEY, data.sessionId);
    setToken(data.sessionId);

    const authUser: AuthUser = {
      id: data.user.id,
      email: data.user.email,
      firstName: data.user.firstName || null,
      lastName: data.user.lastName || null,
      profileImageUrl: data.user.profileImageUrl || null,
    };
    await secureSet(USER_KEY, JSON.stringify(authUser));
    setUser(authUser);
  }, []);

  const logout = useCallback(async () => {
    await secureDelete(TOKEN_KEY);
    await secureDelete(USER_KEY);
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}
