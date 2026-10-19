"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type User = { name: string };
export type SavedScore = { game: string; score: number; name: string; at: number };

const USER_KEY = "av_user";
const SCORES_KEY = "av_scores";

type SessionContextValue = {
  user: User | null;
  login: (user: User) => void;
  signOut: () => void;
  saveScore: (entry: Omit<SavedScore, "at">) => void;
};

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  // localStorage solo se lee tras montar para evitar desajustes de hidratación.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(USER_KEY);
      const parsed = raw ? (JSON.parse(raw) as User | null) : null;
      // eslint-disable-next-line react-hooks/set-state-in-effect -- sincronización única con localStorage tras montar
      if (parsed && typeof parsed.name === "string") setUser(parsed);
    } catch {}
  }, []);

  const login = useCallback((u: User) => {
    const next = { name: u.name.toUpperCase().slice(0, 10) };
    setUser(next);
    try {
      localStorage.setItem(USER_KEY, JSON.stringify(next));
    } catch {}
  }, []);

  const signOut = useCallback(() => {
    setUser(null);
    try {
      localStorage.removeItem(USER_KEY);
    } catch {}
  }, []);

  const saveScore = useCallback((entry: Omit<SavedScore, "at">) => {
    try {
      const all = JSON.parse(localStorage.getItem(SCORES_KEY) || "[]") as SavedScore[];
      all.push({ ...entry, at: Date.now() });
      localStorage.setItem(SCORES_KEY, JSON.stringify(all));
    } catch {}
  }, []);

  const value = useMemo(
    () => ({ user, login, signOut, saveScore }),
    [user, login, signOut, saveScore],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession debe usarse dentro de <SessionProvider>");
  return ctx;
}
