import React, { createContext, useContext, useState, useCallback } from "react";

export type RoleName = "Neighborhood Volunteer" | "Independent Hauler" | "Government Liaison";

export const ROLES: { name: RoleName; icon: string; description: string }[] = [
  { name: "Neighborhood Volunteer", icon: "home-outline", description: "Community members scanning waste in their area" },
  { name: "Independent Hauler", icon: "car-outline", description: "Self-employed haulers tracking loads & drop-offs" },
  { name: "Government Liaison", icon: "business-outline", description: "City officials monitoring regional diversion data" },
];

/* ── Points & Leveling ── */
export const LEVEL_THRESHOLDS = [
  0, 100, 250, 500, 850, 1300, 1900, 2600, 3500, 4600, 6000,
  7800, 10000, 13000, 17000, 22000, 28000, 36000, 46000, 60000,
]; // Level 1 = 0+ pts, Level 20 = 60 000+ pts

export function getLevelInfo(xp: number) {
  let level = 1;
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_THRESHOLDS[i]) { level = i + 1; break; }
  }
  const currentThreshold = LEVEL_THRESHOLDS[level - 1] ?? 0;
  const nextThreshold = LEVEL_THRESHOLDS[level] ?? currentThreshold + 10000;
  const progress = (xp - currentThreshold) / (nextThreshold - currentThreshold);
  return { level, xp, currentThreshold, nextThreshold, progress: Math.min(progress, 1) };
}

export const POINTS = {
  LOGIN: 10,
  SCAN: 25,
  VIEW_IMPACT: 15,
  BADGE_EARNED: 50,
} as const;

/* ── Daily Tasks ── */
export interface DailyTask {
  id: string;
  title: string;
  icon: string;
  points: number;
  completed: boolean;
}

const makeDailyTasks = (): DailyTask[] => [
  { id: "login", title: "Login & check in", icon: "log-in-outline", points: POINTS.LOGIN, completed: false },
  { id: "scan", title: "Complete 1 scan", icon: "scan-outline", points: POINTS.SCAN, completed: false },
  { id: "impact", title: "Check impact", icon: "stats-chart-outline", points: POINTS.VIEW_IMPACT, completed: false },
];

interface User {
  id: string;
  name: string;
  email: string;
  initial: string;
  role: RoleName;
  city: string;
  joinedDate: string;
  profileImage?: string;
  xp: number;
  dailyTasks: DailyTask[];
  /** ISO date string of last daily reset */
  lastTaskReset: string;
}

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  updateProfileImage: (uri: string) => void;
  updateRole: (role: RoleName) => void;
  /** Complete a daily task by id — returns XP gained (0 if already done) */
  completeTask: (taskId: string) => number;
  /** Add arbitrary XP (e.g. badge bonus) — returns new total */
  addXp: (amount: number) => number;
  /** Pending level-up flag (cleared after animation plays) */
  pendingLevelUp: boolean;
  clearLevelUp: () => void;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  isAuthenticated: false,
  login: async () => false,
  signup: async () => false,
  logout: () => {},
  updateProfileImage: () => {},
  updateRole: () => {},
  completeTask: () => 0,
  addXp: () => 0,
  pendingLevelUp: false,
  clearLevelUp: () => {},
});

export const useAuth = () => useContext(AuthContext);

const today = () => new Date().toISOString().slice(0, 10);

// Hardcoded users database
const USERS_DB: Record<string, { password: string; user: User }> = {
  "marcus@greenlens.org": {
    password: "password123",
    user: {
      id: "1",
      name: "Marcus Green",
      email: "marcus@greenlens.org",
      initial: "M",
      role: "Neighborhood Volunteer",
      city: "Atlanta, GA",
      joinedDate: "Oct 2025",
      xp: 1350,
      dailyTasks: makeDailyTasks(),
      lastTaskReset: today(),
    },
  },
  "sarah@greenlens.org": {
    password: "password123",
    user: {
      id: "2",
      name: "Sarah Chen",
      email: "sarah@greenlens.org",
      initial: "S",
      role: "Independent Hauler",
      city: "Savannah, GA",
      joinedDate: "Nov 2025",
      xp: 820,
      dailyTasks: makeDailyTasks(),
      lastTaskReset: today(),
    },
  },
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [pendingLevelUp, setPendingLevelUp] = useState(false);

  /** Reset daily tasks if the date changed */
  const ensureDailyReset = useCallback((u: User): User => {
    const d = today();
    if (u.lastTaskReset !== d) {
      return { ...u, dailyTasks: makeDailyTasks(), lastTaskReset: d };
    }
    return u;
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const entry = USERS_DB[email.toLowerCase().trim()];
    if (entry && entry.password === password) {
      const refreshed = ensureDailyReset(entry.user);
      // Auto-complete the "login" task and grant XP
      const loginTask = refreshed.dailyTasks.find((t) => t.id === "login");
      let xp = refreshed.xp;
      const oldLevel = getLevelInfo(xp).level;
      if (loginTask && !loginTask.completed) {
        xp += loginTask.points;
        refreshed.dailyTasks = refreshed.dailyTasks.map((t) =>
          t.id === "login" ? { ...t, completed: true } : t
        );
      }
      refreshed.xp = xp;
      if (getLevelInfo(xp).level > oldLevel) setPendingLevelUp(true);
      setUser(refreshed);
      return true;
    }
    return false;
  }, [ensureDailyReset]);

  const signup = useCallback(
    async (name: string, email: string, password: string) => {
      const key = email.toLowerCase().trim();
      if (USERS_DB[key]) return false;

      const tasks = makeDailyTasks().map((t) =>
        t.id === "login" ? { ...t, completed: true } : t
      );

      const newUser: User = {
        id: String(Date.now()),
        name,
        email: key,
        initial: name.charAt(0).toUpperCase(),
        role: "Neighborhood Volunteer",
        city: "Georgia",
        joinedDate: new Date().toLocaleDateString("en-US", { month: "short", year: "numeric" }),
        xp: POINTS.LOGIN,
        dailyTasks: tasks,
        lastTaskReset: today(),
      };

      USERS_DB[key] = { password, user: newUser };
      setUser(newUser);
      return true;
    },
    []
  );

  const logout = useCallback(() => setUser(null), []);

  const updateProfileImage = useCallback((uri: string) => {
    setUser((prev) => (prev ? { ...prev, profileImage: uri } : null));
  }, []);

  const updateRole = useCallback((role: RoleName) => {
    setUser((prev) => (prev ? { ...prev, role } : null));
  }, []);

  const completeTask = useCallback((taskId: string): number => {
    let gained = 0;
    setUser((prev) => {
      if (!prev) return null;
      const u = ensureDailyReset(prev);
      const task = u.dailyTasks.find((t) => t.id === taskId);
      if (!task || task.completed) return u;
      gained = task.points;
      const oldLevel = getLevelInfo(u.xp).level;
      const newXp = u.xp + gained;
      if (getLevelInfo(newXp).level > oldLevel) setPendingLevelUp(true);
      return {
        ...u,
        xp: newXp,
        dailyTasks: u.dailyTasks.map((t) =>
          t.id === taskId ? { ...t, completed: true } : t
        ),
      };
    });
    return gained;
  }, [ensureDailyReset]);

  const addXp = useCallback((amount: number): number => {
    let newTotal = 0;
    setUser((prev) => {
      if (!prev) return null;
      const oldLevel = getLevelInfo(prev.xp).level;
      newTotal = prev.xp + amount;
      if (getLevelInfo(newTotal).level > oldLevel) setPendingLevelUp(true);
      return { ...prev, xp: newTotal };
    });
    return newTotal;
  }, []);

  const clearLevelUp = useCallback(() => setPendingLevelUp(false), []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        login,
        signup,
        logout,
        updateProfileImage,
        updateRole,
        completeTask,
        addXp,
        pendingLevelUp,
        clearLevelUp,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
