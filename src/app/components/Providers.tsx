'use client';

import { SettingsProvider } from "../lib/contexts/SettingsContext";
import { AuthProvider } from "../../lib/contexts/AuthContext";
import { Menu } from "./Menu";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <SettingsProvider>
        <Menu />
        {children}
      </SettingsProvider>
    </AuthProvider>
  );
} 