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
  try {
    const SecureStore = await import("expo-secure-store");
    return await SecureStore.getItemAsync(key);
  } catch {
    return null;
  }
}

async function secureSet(key: string, value: string): Promise<void> {
  if (!value || typeof value !== "string") return;
  if (Platform.OS === "web") {
    try {
      if (typeof window !== "undefined") window.localStorage.setItem(key, value);
    } catch { }
    return;
  }
  try {
    const SecureStore = await import("expo-secure-store");
    // SecureStore has a 2048-byte limit per value on some platforms
    // Truncate safely or skip if too large
    if (value.length > 2000) {
      console.warn("[Auth] Skipping SecureStore for key", key, "- value too large");
      return;
    }
    await SecureStore.setItemAsync(key, value);
  } catch (err) {
    console.warn("[Auth] SecureStore setItem failed for key", key, err);
  }
}

async function secureDelete(key: string): Promise<void> {
  if (Platform.OS === "web") {
    try {
      if (typeof window !== "undefined") window.localStorage.removeItem(key);
    } catch { }
    return;
  }
  try {
    const SecureStore = await import("expo-secure-store");
    await SecureStore.deleteItemAsync(key);
  } catch (err) {
    console.warn("[Auth] SecureStore deleteItem failed for key", key, err);
  }
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
        // Ignore load errors — user will need to sign in again
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const persistSession = useCallback(async (sessionId: string, authUser: AuthUser) => {
    // Store token (64-char hex, always safe)
    await secureSet(TOKEN_KEY, sessionId);

    // Store user — keep payload compact to avoid SecureStore size limits
    const compactUser = {
      id: authUser.id,
      email: authUser.email,
      firstName: authUser.firstName,
      lastName: authUser.lastName,
      profileImageUrl: null, // skip large URLs from storage
    };
    await secureSet(USER_KEY, JSON.stringify(compactUser));
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

    const authUser: AuthUser = {
      id: data.user.id,
      email: data.user.email,
      firstName: data.user.firstName || null,
      lastName: data.user.lastName || null,
      profileImageUrl: data.user.profileImageUrl || null,
    };

    // Set state immediately so the user is logged in even if persistence fails
    setToken(data.sessionId);
    setUser(authUser);

    // Persist in background — don't await to avoid blocking navigation
    persistSession(data.sessionId, authUser).catch(console.warn);
  }, [persistSession]);

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

    const authUser: AuthUser = {
      id: data.user.id,
      email: data.user.email,
      firstName: data.user.firstName || null,
      lastName: data.user.lastName || null,
      profileImageUrl: data.user.profileImageUrl || null,
    };

    // Set state immediately so the user is logged in even if persistence fails
    setToken(data.sessionId);
    setUser(authUser);

    // Persist in background — don't await to avoid blocking navigation
    persistSession(data.sessionId, authUser).catch(console.warn);
  }, [persistSession]);

  const logout = useCallback(async () => {
    setToken(null);
    setUser(null);
    await secureDelete(TOKEN_KEY);
    await secureDelete(USER_KEY);
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
