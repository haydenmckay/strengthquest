'use client';

import React from 'react';
import { Logo } from '../components/Logo';
import { useSettings } from '../lib/contexts/SettingsContext';

export default function SettingsPage() {
  const { unit, barbellWeight, toggleUnit, setBarbellWeight, convertWeight } = useSettings();

  const handleBarbellWeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value === '' ? 0 : Number(e.target.value);
    setBarbellWeight(value);
  };

  // Display the weight in the current unit
  const displayBarbellWeight = unit === 'lbs' ? 
    Math.round(barbellWeight * 2.20462) : // Convert to lbs and round to whole number
    barbellWeight;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-8">
          <Logo />
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Settings</h2>
          
          <div className="space-y-8">
            {/* Units Toggle */}
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium text-gray-800">Weight Units</h3>
                <p className="text-sm text-gray-500">Choose your preferred unit of measurement</p>
              </div>
              <div className="flex items-center justify-center gap-6">
                <span className={`text-sm font-medium ${unit === 'kg' ? 'text-blue-600' : 'text-gray-600'}`}>
                  Kilograms (kg)
                </span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox"
                    className="sr-only peer"
                    checked={unit === 'lbs'}
                    onChange={toggleUnit}
                  />
                  <div className="w-14 h-7 bg-gray-100 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-blue-600 after:rounded-full after:h-6 after:w-6 after:transition-all"></div>
                </label>
                <span className={`text-sm font-medium ${unit === 'lbs' ? 'text-blue-600' : 'text-gray-600'}`}>
                  Pounds (lbs)
                </span>
              </div>
            </div>

            {/* Barbell Weight Override */}
            <div>
              <h3 className="text-lg font-medium text-gray-800 mb-2">Default Barbell Weight</h3>
              <p className="text-sm text-gray-500 mb-4">Override the default barbell weight used in calculations</p>
              <div className="flex items-center gap-4">
                <input
                  type="number"
                  className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 text-black"
                  placeholder={unit === 'kg' ? "20" : "44"}
                  min="0"
                  step="0.5"
                  value={displayBarbellWeight || ''}
                  onChange={handleBarbellWeightChange}
                />
                <span className="text-sm font-medium text-gray-600">
                  {unit}
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                Standard Olympic barbell: {unit === 'kg' ? '20kg' : '44lbs'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 