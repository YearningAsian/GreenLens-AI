import React, { createContext, useContext, useState, useCallback } from "react";
import { fetchUserByEmail, loginUserDb, addXpDb, updateProfileDb, recordDailyTaskDb, fetchAllUsers, fetchUserScans, getRecyclingCenters, fetchActivityFeed, type DbUser } from "../services/api";
import * as Location from "expo-location";

export type RoleName = "Neighborhood Volunteer" | "General Worker" | "Government Worker";

export const ROLES: { name: RoleName; icon: string; description: string }[] = [
  { name: "Neighborhood Volunteer", icon: "home-outline", description: "Community members scanning waste in their area" },
  { name: "General Worker", icon: "car-outline", description: "Workers tracking waste loads & drop-offs" },
  { name: "Government Worker", icon: "business-outline", description: "Employees monitoring municipal diversion data" },
];

const ROLE_MAP: Record<string, RoleName> = {
  volunteer: "Neighborhood Volunteer",
  hauler: "General Worker",
  liaison: "Government Worker",
};

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

export interface User {
  id: string;
  name: string;
  email: string;
  initial: string;
  role: RoleName;
  city: string;
  state: string;
  joinedDate: string;
  profileImage?: string;
  xp: number;
  level: number;
  streakDays: number;
  lastActiveDate?: string;
  totalScans: number;
  totalWeightDiverted: number;
  totalCo2Saved: number;
  dailyTasks: DailyTask[];
  /** ISO date string of last daily reset */
  lastTaskReset: string;
  /** Privacy flag for leaderboard name masking */
  leaderboardPrivacy?: boolean;
}

export interface PrefetchedData {
  allUsers: DbUser[];
  userScans: any[];
  centers: any[];
  activityFeed: any[];
  userLocation?: { latitude: number; longitude: number };
}

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  /** True while login + data prefetch is in progress */
  isLoading: boolean;
  /** Prefetched data available immediately after login */
  prefetched: PrefetchedData | null;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  updateProfileImage: (uri: string) => void;
  updateRole: (role: RoleName) => void;
  updateLeaderboardPrivacy: (enabled: boolean) => void;
  /** Complete a daily task by id — returns XP gained (0 if already done) */
  completeTask: (taskId: string) => number;
  /** Add arbitrary XP (e.g. badge bonus) — returns new total */
  addXp: (amount: number) => number;
  /** Pending level-up flag (cleared after animation plays) */
  pendingLevelUp: boolean;
  clearLevelUp: () => void;
  /** Refresh user data from DB */
  refreshUser: () => Promise<void>;
  /** Re-fetch prefetched data (e.g. after a scan changes things) */
  refreshPrefetch: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  prefetched: null,
  login: async () => false,
  signup: async () => false,
  logout: () => {},
  updateProfileImage: () => {},
  updateRole: () => {},
  updateLeaderboardPrivacy: () => {},
  completeTask: () => 0,
  addXp: () => 0,
  pendingLevelUp: false,
  clearLevelUp: () => {},
  refreshUser: async () => {},
  refreshPrefetch: async () => {},
});

export const useAuth = () => useContext(AuthContext);

const today = () => new Date().toISOString().slice(0, 10);

/** Convert Convex DB user to our local User model */
function dbToUser(db: DbUser): User {
  return {
    id: db._id,
    name: db.name,
    email: db.email,
    initial: db.name.charAt(0).toUpperCase(),
    role: ROLE_MAP[db.role] || "Neighborhood Volunteer",
    city: `${db.city}, ${db.state === "Georgia" ? "GA" : "TN"}`,
    state: db.state,
    joinedDate: db.joinedDate,
    profileImage: db.profileImageUrl
      ? db.profileImageUrl.replace("/svg?", "/png?")
      : undefined,
    xp: db.xp,
    level: db.level,
    streakDays: db.streakDays,
    lastActiveDate: db.lastActiveDate,
    totalScans: db.totalScans,
    totalWeightDiverted: db.totalWeightDiverted,
    totalCo2Saved: db.totalCo2Saved,
    dailyTasks: makeDailyTasks(),
    lastTaskReset: today(),
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [pendingLevelUp, setPendingLevelUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [prefetched, setPrefetched] = useState<PrefetchedData | null>(null);

  /** Prefetch all data screens need after login */
  const prefetchAll = useCallback(async (userState: string, userEmail: string) => {
    console.log("[AuthContext] Prefetching all data...");
    try {
      const [allUsers, userScans, centersData, activityFeed, locationResult] = await Promise.all([
        fetchAllUsers(userState).catch(() => [] as DbUser[]),
        fetchUserScans(userEmail).catch(() => []),
        getRecyclingCenters().then(r => r.centers ?? []).catch(() => []),
        fetchActivityFeed(userState, 20).catch(() => []),
        (async () => {
          try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== "granted") return undefined;
            const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
            return { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
          } catch { return undefined; }
        })(),
      ]);
      const data: PrefetchedData = { allUsers, userScans, centers: centersData, activityFeed, userLocation: locationResult ?? undefined };
      console.log(`[AuthContext] Prefetch done: ${allUsers.length} users, ${userScans.length} scans, ${centersData.length} centers, location: ${locationResult ? 'yes' : 'no'}`);
      setPrefetched(data);
      return data;
    } catch (e) {
      console.warn("[AuthContext] Prefetch partial failure:", e);
      setPrefetched({ allUsers: [], userScans: [], centers: [], activityFeed: [] });
    }
  }, []);

  /** Reset daily tasks if the date changed */
  const ensureDailyReset = useCallback((u: User): User => {
    const d = today();
    if (u.lastTaskReset !== d) {
      return { ...u, dailyTasks: makeDailyTasks(), lastTaskReset: d };
    }
    return u;
  }, []);

  /** Refresh user data from Convex DB */
  const refreshUser = useCallback(async () => {
    if (!user) return;
    try {
      const db = await fetchUserByEmail(user.email);
      if (db) {
        setUser(prev => {
          if (!prev) return null;
          // Preserve local-only state (daily tasks, profile image override)
          return {
            ...dbToUser(db),
            dailyTasks: prev.dailyTasks,
            lastTaskReset: prev.lastTaskReset,
            profileImage: prev.profileImage,
          };
        });
      }
    } catch (e) {
      console.warn("[AuthContext] Failed to refresh user from DB:", e);
    }
  }, [user?.email]);

  const login = useCallback(async (email: string, password: string) => {
    const trimmed = email.toLowerCase().trim();
    setIsLoading(true);
    try {
      // Try Convex DB login
      const result = await loginUserDb(trimmed, `pbkdf2_sha256$${password}`);
      if (result) {
        const dbUser = result as DbUser;
        const freshUser = dbToUser(dbUser);
        // Auto-complete the "login" task
        freshUser.dailyTasks = freshUser.dailyTasks.map(t =>
          t.id === "login" ? { ...t, completed: true } : t
        );
        const oldLevel = getLevelInfo(freshUser.xp).level;
        freshUser.xp += POINTS.LOGIN;
        if (getLevelInfo(freshUser.xp).level > oldLevel) setPendingLevelUp(true);
        setUser(freshUser);
        // Award XP in DB too (fire-and-forget)
        try { addXpDb(trimmed, POINTS.LOGIN, "daily_login"); } catch {}
        // Prefetch all data before showing the app
        await prefetchAll(freshUser.state, freshUser.email);
        setIsLoading(false);
        return true;
      }
    } catch (e) {
      console.warn("[AuthContext] Convex login failed, trying fallback:", e);
    }

    // Fallback: fetch user by email and accept any password (demo mode)
    try {
      const db = await fetchUserByEmail(trimmed);
      if (db) {
        const freshUser = dbToUser(db);
        freshUser.dailyTasks = freshUser.dailyTasks.map(t =>
          t.id === "login" ? { ...t, completed: true } : t
        );
        const oldLevel = getLevelInfo(freshUser.xp).level;
        freshUser.xp += POINTS.LOGIN;
        if (getLevelInfo(freshUser.xp).level > oldLevel) setPendingLevelUp(true);
        setUser(freshUser);
        // Prefetch all data before showing the app
        await prefetchAll(freshUser.state, freshUser.email);
        setIsLoading(false);
        return true;
      }
    } catch (e) {
      console.warn("[AuthContext] DB fetch failed:", e);
    }

    setIsLoading(false);
    return false;
  }, [prefetchAll]);

  const signup = useCallback(async (_name: string, _email: string, _password: string) => {
    // For now, signup just logs in with the email if the user exists in DB
    return login(_email, _password);
  }, [login]);

  const logout = useCallback(() => {
    // Full reset — next login will re-fetch fresh from DB
    setUser(null);
    setPrefetched(null);
    setPendingLevelUp(false);
  }, []);

  const updateProfileImage = useCallback((uri: string) => {
    setUser(prev => (prev ? { ...prev, profileImage: uri } : null));
  }, []);

  const updateRole = useCallback((role: RoleName) => {
    setUser(prev => {
      if (!prev) return null;
      // Map display name back to DB role key
      const dbRole = Object.entries(ROLE_MAP).find(([, v]) => v === role)?.[0] as "volunteer" | "hauler" | "liaison" | undefined;
      if (dbRole) updateProfileDb(prev.email, { role: dbRole }).catch(() => {});
      return { ...prev, role };
    });
  }, []);

  const updateLeaderboardPrivacy = useCallback((enabled: boolean) => {
    setUser(prev => {
      if (!prev) return null;
      updateProfileDb(prev.email, { leaderboardPrivacy: enabled }).catch(() => {});
      return { ...prev, leaderboardPrivacy: enabled };
    });
  }, []);

  const completeTask = useCallback((taskId: string): number => {
    let gained = 0;
    setUser(prev => {
      if (!prev) return null;
      const u = ensureDailyReset(prev);
      const task = u.dailyTasks.find(t => t.id === taskId);
      if (!task || task.completed) return u;
      gained = task.points;
      const oldLevel = getLevelInfo(u.xp).level;
      const newXp = u.xp + gained;
      if (getLevelInfo(newXp).level > oldLevel) setPendingLevelUp(true);

      // Persist to Convex (fire-and-forget)
      addXpDb(u.email, gained, `daily_${taskId}`).catch(() => {});
      recordDailyTaskDb(u.email, taskId, gained).catch(() => {});

      return {
        ...u,
        xp: newXp,
        dailyTasks: u.dailyTasks.map(t =>
          t.id === taskId ? { ...t, completed: true } : t
        ),
      };
    });
    return gained;
  }, [ensureDailyReset]);

  const addXp = useCallback((amount: number): number => {
    let newTotal = 0;
    setUser(prev => {
      if (!prev) return null;
      const oldLevel = getLevelInfo(prev.xp).level;
      newTotal = prev.xp + amount;
      if (getLevelInfo(newTotal).level > oldLevel) setPendingLevelUp(true);
      // Persist to Convex
      addXpDb(prev.email, amount, "bonus").catch(() => {});
      return { ...prev, xp: newTotal };
    });
    return newTotal;
  }, []);

  const clearLevelUp = useCallback(() => setPendingLevelUp(false), []);

  /** Re-fetch prefetched data (e.g. after a scan) */
  const refreshPrefetch = useCallback(async () => {
    if (!user) return;
    await prefetchAll(user.state, user.email);
  }, [user?.state, user?.email, prefetchAll]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        prefetched,
        login,
        signup,
        logout,
        updateProfileImage,
        updateRole,
        updateLeaderboardPrivacy,
        completeTask,
        addXp,
        pendingLevelUp,
        clearLevelUp,
        refreshUser,
        refreshPrefetch,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
