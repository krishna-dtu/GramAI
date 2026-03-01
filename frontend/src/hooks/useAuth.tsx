import { createContext, useContext, useState, useCallback, ReactNode } from "react";

type Role = "asha" | "doctor";

interface User {
  name: string;
  role: Role;
  avatar: string;
}

const roleProfiles: Record<Role, Omit<User, "role">> = {
  asha: { name: "Sunita Devi", avatar: "SD" },
  doctor: { name: "Dr. Sharma", avatar: "DS" },
};

const mockUsers: Record<string, { password: string; user: User }> = {
  "asha@gramai.in": {
    password: "asha123",
    user: { name: "Sunita Devi", role: "asha", avatar: "SD" },
  },
  "doctor@gramai.in": {
    password: "doctor123",
    user: { name: "Dr. Arvind Mehta", role: "doctor", avatar: "AM" },
  },
};

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => { success: boolean; error?: string };
  logout: () => void;
  switchRole: (role: Role) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem("gramai_user");
    return stored ? JSON.parse(stored) : null;
  });

  const login = useCallback((email: string, password: string) => {
    const entry = mockUsers[email.toLowerCase()];
    if (!entry) return { success: false, error: "User not found" };
    if (entry.password !== password) return { success: false, error: "Incorrect password" };
    setUser(entry.user);
    localStorage.setItem("gramai_user", JSON.stringify(entry.user));
    return { success: true };
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem("gramai_user");
  }, []);

  const switchRole = useCallback((role: Role) => {
    const profile = roleProfiles[role];
    const newUser: User = { ...profile, role };
    setUser(newUser);
    localStorage.setItem("gramai_user", JSON.stringify(newUser));
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout, switchRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
