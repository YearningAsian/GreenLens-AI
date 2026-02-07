import React, { createContext, useContext, useState, useCallback } from "react";

interface User {
  id: string;
  name: string;
  email: string;
  initial: string;
  jobSite: string;
  city: string;
  joinedDate: string;
  profileImage?: string;
}

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  updateProfileImage: (uri: string) => void;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  isAuthenticated: false,
  login: async () => false,
  signup: async () => false,
  logout: () => {},
  updateProfileImage: () => {},
});

export const useAuth = () => useContext(AuthContext);

// Hardcoded users database
const USERS_DB: Record<string, { password: string; user: User }> = {
  "marcus@greenlens.org": {
    password: "password123",
    user: {
      id: "1",
      name: "Marcus Green",
      email: "marcus@greenlens.org",
      initial: "M",
      jobSite: "Midtown Tower Phase 2",
      city: "Atlanta, GA",
      joinedDate: "Oct 2025",
    },
  },
  "sarah@greenlens.org": {
    password: "password123",
    user: {
      id: "2",
      name: "Sarah Chen",
      email: "sarah@greenlens.org",
      initial: "S",
      jobSite: "Savannah Riverfront",
      city: "Savannah, GA",
      joinedDate: "Nov 2025",
    },
  },
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const login = useCallback(async (email: string, password: string) => {

    const entry = USERS_DB[email.toLowerCase().trim()];
    if (entry && entry.password === password) {
      setUser(entry.user);
      return true;
    }
    return false;
  }, []);

  const signup = useCallback(
    async (name: string, email: string, password: string) => {

      const key = email.toLowerCase().trim();
      if (USERS_DB[key]) {
        return false; // Already exists
      }

      const newUser: User = {
        id: String(Date.now()),
        name,
        email: key,
        initial: name.charAt(0).toUpperCase(),
        jobSite: "Unassigned",
        city: "Georgia",
        joinedDate: new Date().toLocaleDateString("en-US", {
          month: "short",
          year: "numeric",
        }),
      };

      // Add to "database"
      USERS_DB[key] = { password, user: newUser };
      setUser(newUser);
      return true;
    },
    []
  );

  const logout = useCallback(() => {
    setUser(null);
  }, []);

  const updateProfileImage = useCallback((uri: string) => {
    setUser((prev) => (prev ? { ...prev, profileImage: uri } : null));
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated: !!user, login, signup, logout, updateProfileImage }}
    >
      {children}
    </AuthContext.Provider>
  );
}
