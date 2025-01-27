'use client';

import React from 'react';
import { useExercises } from '../lib/hooks/useExercises';
import { useSettings } from '../lib/contexts/SettingsContext';
import { Exercise } from '../lib/types';
import { Logo } from '../components/Logo';
import { GiWeightLiftingUp, GiMuscularTorso, GiBiceps } from 'react-icons/gi';
import { CgGym } from 'react-icons/cg';
import { IoBarbell } from 'react-icons/io5';
import { ImPowerCord } from 'react-icons/im';

// Function to format large numbers
const formatNumber = (num: number): string => {
  if (num === 0) return '0';
  if (Math.abs(num) >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (Math.abs(num) >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
};

// Map exercise names to icons
const exerciseIcons: Record<string, React.ElementType> = {
  'Squat': IoBarbell,           // Barbell icon for squats
  'Deadlift': GiWeightLiftingUp,  // Person bending over lifting
  'Shoulder Press': GiWeightLiftingUp, // Person lifting weights
  'Bench Press': GiMuscularTorso,  // Upper body strength
  'Power Clean': GiWeightLiftingUp, // Person lifting weights
  'Chin Ups': GiBiceps,   // Bicep flex icon
  'Back Extension': CgGym,      // Gym equipment
};

export default function ProfilePage() {
  const { exercises } = useExercises();
  const { unit, convertWeight } = useSettings();
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    // Wait for next tick to ensure client-side values are ready
    const timer = setTimeout(() => setIsLoading(false), 0);
    return () => clearTimeout(timer);
  }, []);

  const calculateTotalVolume = (exerciseId: string) => {
    const exercise = exercises.find(e => e.id === exerciseId);
    if (!exercise?.history) return 0;

    return exercise.history.reduce((total, entry) => {
      const weight = entry.weight;
      const volume = weight * entry.sets * entry.reps;
      return total + volume;
    }, 0);
  };

  const findPersonalBest = (exercise: Exercise): { weight: number; date: Date } | null => {
    if (!exercise.history || exercise.history.length === 0) return null;
    
    const pb = exercise.history.reduce((max, entry) => {
      return entry.weight > max.weight ? { weight: entry.weight, date: entry.date } : max;
    }, { weight: 0, date: new Date() });

    return pb.weight === 0 ? null : pb;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-3xl mx-auto p-6">
          <div className="mb-8">
            <Logo />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-8">The Ledger of Gains</h1>
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4, 5, 6, 7].map((i) => (
              <div key={i} className="bg-white rounded-lg shadow-sm p-4 animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto p-6">
        <div className="mb-8">
          <Logo />
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-8">The Ledger of Gains</h1>
        
        <div className="grid grid-cols-2 gap-4">
          {exercises.map((exercise) => {
            const totalVolume = calculateTotalVolume(exercise.id);
            const pb = findPersonalBest(exercise);
            const Icon = exerciseIcons[exercise.name] || GiWeightLiftingUp;

            return (
              <div key={exercise.id} className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-2 mb-3">
                  <Icon className="w-5 h-5 text-blue-600 flex-shrink-0 mt-1" />
                  <h2 className="text-lg font-semibold text-gray-800 leading-tight">{exercise.name}</h2>
                </div>

                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-gray-500">Total Volume</p>
                    <p className="text-xl font-bold text-gray-900">
                      {formatNumber(unit === 'lbs' ? convertWeight(totalVolume) : totalVolume)} {unit}
                    </p>
                  </div>

                  {pb && (
                    <div>
                      <p className="text-xs text-gray-500">Personal Best</p>
                      <p className="text-base font-semibold text-blue-600">
                        {unit === 'lbs' ? convertWeight(pb.weight) : pb.weight} {unit}
                      </p>
                      <p className="text-xs text-gray-400">
                        {new Date(pb.date).toLocaleDateString()}
                      </p>
                    </div>
                  )}

                  {exercise.history && (
                    <div>
                      <p className="text-xs text-gray-500">Workouts</p>
                      <p className="text-base font-semibold text-gray-700">
                        {exercise.history.length}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
} 