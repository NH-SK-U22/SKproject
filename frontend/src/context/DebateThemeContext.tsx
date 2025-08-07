import React, { createContext, useContext, useState, useCallback } from "react";
import { getCurrentUser } from "../utils/auth";

export interface DebateTheme {
  theme_id: number;
  title: string;
  description: string;
  colorset_id: number;
  start_date: string;
  end_date: string;
  team1: string;
  team2: string;
}

interface DebateThemeContextType {
  theme: DebateTheme | null;
  fetchTheme: () => Promise<void>;
  setTheme: (theme: DebateTheme | null) => void;
}

const DebateThemeContext = createContext<DebateThemeContextType | undefined>(undefined);

export const DebateThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<DebateTheme | null>(null);

  const fetchTheme = useCallback(async () => {
    const user = getCurrentUser();
    const school_id = user?.school_id;
    try {
      const response = await fetch(`http://localhost:5000/api/newest_theme?school_id=${school_id}`);
      if (response.ok) {
        const data = await response.json();
        if (!data) return;
        const now = new Date();
        const end = new Date(data.end_date);
        if (now > end) {
          setTheme(null);
        } else {
          setTheme(data);
        }
      } else {
        setTheme(null);
      }
    } catch (error) {
      setTheme(null);
    }
  }, []);

  return (
    <DebateThemeContext.Provider value={{ theme, fetchTheme, setTheme }}>
      {children}
    </DebateThemeContext.Provider>
  );
};

export const useDebateTheme = () => {
  const context = useContext(DebateThemeContext);
  if (!context) {
    throw new Error("DebateThemeProvider内でuseDebateThemeを使用してください");
  }
  return context;
}; 