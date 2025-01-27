'use client';

import { SettingsProvider } from "../lib/contexts/SettingsContext";
import { Menu } from "./Menu";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SettingsProvider>
      <Menu />
      {children}
    </SettingsProvider>
  );
} 