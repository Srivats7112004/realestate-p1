import { createContext, useContext, useEffect, useMemo, useState } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    try {
      const response = await fetch("/api/auth/me");
      const data = await response.json();

      if (response.ok) {
        setUser(data.user || null);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error("Failed to refresh user:", error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const register = async (payload) => {
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Registration failed");
    }

    setUser(data.user);
    return data.user;
  };

  const login = async (payload) => {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Login failed");
    }

    setUser(data.user);
    return data.user;
  };

  const logout = async () => {
    const response = await fetch("/api/auth/logout", {
      method: "POST",
    });

    if (!response.ok) {
      throw new Error("Logout failed");
    }

    setUser(null);
  };

  const linkWallet = async (walletAddress) => {
    const response = await fetch("/api/wallet/link", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ walletAddress }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Wallet linking failed");
    }

    setUser(data.user);
    return data.user;
  };

  const switchRole = async (role) => {
    const response = await fetch("/api/auth/dev-set-role", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ role }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Role switch failed");
    }

    setUser(data.user);
    return data.user;
  };

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: !!user,
      register,
      login,
      logout,
      refreshUser,
      linkWallet,
      switchRole,
      setUser,
    }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}