'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

type Unit = 'kg' | 'lbs';

interface Settings {
  unit: Unit;
  barbellWeight: number; // Always stored in kg internally
}

interface SettingsContextType extends Settings {
  toggleUnit: () => void;
  setBarbellWeight: (weight: number) => void;
  convertWeight: (weight: number, from?: Unit, to?: Unit) => number;
  displayWeight: (weight: number) => string;
}

const DEFAULT_SETTINGS: Settings = {
  unit: 'kg',
  barbellWeight: 20, // 20kg is the standard Olympic barbell weight
};

const KG_TO_LBS = 2.20462;
const LBS_TO_KG = 1 / KG_TO_LBS;

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('settings');
    if (saved) {
      setSettings(JSON.parse(saved));
    }
    setIsLoaded(true);
  }, []);

  const toggleUnit = useCallback(() => {
    setSettings(prev => {
      const newUnit: Unit = prev.unit === 'kg' ? 'lbs' : 'kg';
      const newSettings: Settings = {
        ...prev,
        unit: newUnit,
      };
      localStorage.setItem('settings', JSON.stringify(newSettings));
      return newSettings;
    });
  }, []);

  const setBarbellWeight = useCallback((weight: number) => {
    setSettings(prev => {
      // If in lbs mode, convert to kg before storing
      const weightInKg = prev.unit === 'lbs' ? Number((weight * LBS_TO_KG).toFixed(1)) : weight;
      const newSettings = { ...prev, barbellWeight: weightInKg };
      localStorage.setItem('settings', JSON.stringify(newSettings));
      return newSettings;
    });
  }, []);

  const convertWeight = useCallback((weight: number, from: Unit = 'kg', to?: Unit) => {
    const targetUnit = to || settings.unit;
    if (from === targetUnit) return weight;
    return from === 'kg' 
      ? Math.round(weight * KG_TO_LBS) // Convert to lbs and round to whole number
      : Number((weight * LBS_TO_KG).toFixed(1)); // Convert to kg and keep 1 decimal
  }, [settings.unit]);

  const displayWeight = useCallback((weight: number) => {
    const converted = convertWeight(weight);
    return `${Math.round(converted)} ${settings.unit}`;
  }, [settings.unit, convertWeight]);

  if (!isLoaded) {
    return null; // or a loading spinner
  }

  return (
    <SettingsContext.Provider
      value={{
        ...settings,
        toggleUnit,
        setBarbellWeight,
        convertWeight,
        displayWeight,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}; 