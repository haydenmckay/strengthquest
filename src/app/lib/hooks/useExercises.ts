'use client';

import { useState, useCallback, useEffect } from 'react';
import { Exercise, DEFAULT_EXERCISES, WorkoutEntry } from '../types';
import { useSettings } from '../contexts/SettingsContext';
import { useAuth } from '../../../lib/contexts/AuthContext';
import { v4 as uuidv4 } from 'uuid';

export const useExercises = () => {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const { barbellWeight, unit, convertWeight } = useSettings();
  const { user } = useAuth();

  // Fetch exercises from the database
  useEffect(() => {
    async function fetchExercises() {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch('/api/exercises');
        if (!response.ok) throw new Error('Failed to fetch exercises');
        
        const data = await response.json();
        const exercisesWithHistory = data.exercises.map((exercise: any) => ({
          ...exercise,
          history: exercise.workoutEntries.map((entry: any) => ({
            date: new Date(entry.date),
            weight: entry.weight,
            sets: entry.sets,
            reps: entry.reps,
            comment: entry.comments
          }))
        }));
        
        setExercises(exercisesWithHistory);
      } catch (error) {
        console.error('Failed to fetch exercises:', error);
        // Load defaults if fetch fails
        setExercises(DEFAULT_EXERCISES.map(exercise => ({ ...exercise, id: uuidv4() })));
      } finally {
        setLoading(false);
      }
    }

    fetchExercises();
  }, [user]);

  // Helper function to round to nearest valid plate combination
  const roundToValidIncrement = useCallback((weight: number): number => {
    if (unit === 'kg') {
      // Available plate sizes in kg: 0.25, 0.5, 1.25, 2.5, 5, 10, 15, 20, 25
      // We want to round to the nearest 0.25 since that's our smallest plate
      return Math.round(weight * 4) / 4;
    } else {
      // Available plate sizes in lbs: 0.25, 0.5, 1.25, 2.5, 5, 10, 25, 35, 45
      // We want to round to the nearest 0.25 since that's our smallest plate
      return Math.round(weight * 4) / 4;
    }
  }, [unit]);

  // Helper function to get valid plate combinations
  const getPlatesForWeight = useCallback((targetWeight: number): string => {
    if (unit === 'kg') {
      const plates = [25, 20, 15, 10, 5, 2.5, 1.25, 0.5, 0.25];
      let remaining = targetWeight;
      const used: number[] = [];
      
      plates.forEach(plate => {
        while (remaining >= plate) {
          used.push(plate);
          remaining -= plate;
        }
      });
      
      if (remaining > 0 && remaining < 0.25) {
        return used.length ? `${used.join(' + ')} kg` : '0 kg';
      }
      return used.length ? `${used.join(' + ')} kg` : '0 kg';
    }
    return ''; // For lbs we'll implement later
  }, [unit]);

  const addExercise = useCallback(async (name: string) => {
    if (!user) return;

    try {
      const response = await fetch('/api/exercises', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'create',
          exercise: {
            name,
            canUseBarbell: true,
            isDefault: false
          }
        })
      });

      if (!response.ok) throw new Error('Failed to create exercise');
      
      const { exercise } = await response.json();
      setExercises(prev => [...prev, {
        ...exercise,
        sets: 3,
        reps: 5,
        weight: 0,
        useBarbell: false,
        isSelected: true,
        isCustom: true,
        history: []
      }]);
    } catch (error) {
      console.error('Failed to add exercise:', error);
    }
  }, [user]);

  const updateExercise = useCallback(async (id: string, updates: Partial<Exercise>) => {
    if (!user) return;

    try {
      const response = await fetch('/api/exercises', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'update',
          exercise: { id, ...updates }
        })
      });

      if (!response.ok) throw new Error('Failed to update exercise');

      setExercises(prev => 
        prev.map(exercise => 
          exercise.id === id ? { ...exercise, ...updates } : exercise
        )
      );
    } catch (error) {
      console.error('Failed to update exercise:', error);
    }
  }, [user]);

  const deleteExercise = useCallback(async (id: string) => {
    if (!user) return;

    try {
      const response = await fetch('/api/exercises', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'delete',
          exercise: { id }
        })
      });

      if (!response.ok) throw new Error('Failed to delete exercise');

      setExercises(prev => prev.filter(exercise => exercise.id !== id));
    } catch (error) {
      console.error('Failed to delete exercise:', error);
    }
  }, [user]);

  const toggleExercise = useCallback(async (id: string) => {
    // Update local state immediately for better UX
    setExercises(prev => 
      prev.map(exercise => 
        exercise.id === id ? { ...exercise, isSelected: !exercise.isSelected } : exercise
      )
    );

    // Then sync with database
    try {
      const exercise = exercises.find(e => e.id === id);
      if (!exercise) return;

      const response = await fetch(`/api/exercises/${id}/toggle-selection`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        // If the update fails, revert the local state
        setExercises(prev => 
          prev.map(exercise => 
            exercise.id === id ? { ...exercise, isSelected: !exercise.isSelected } : exercise
          )
        );
        throw new Error('Failed to update exercise');
      }
    } catch (error) {
      console.error('Failed to update exercise:', error);
    }
  }, [exercises]);

  const calculateTotalWeight = useCallback((exercise: Exercise) => {
    if (exercise.name === 'Chin Ups') {
      if (!exercise.chinUpType) return 0;
      switch (exercise.chinUpType) {
        case 'bodyweight':
          return 0;
        case 'weighted':
          return roundToValidIncrement(exercise.weight); // Round weight for weighted chin-ups
        case 'assisted-machine':
        case 'assisted-bands':
          return -Math.abs(roundToValidIncrement(exercise.weight)); // Round weight for assisted chin-ups
        default:
          return 0;
      }
    }
    
    if (exercise.useBarbell) {
      // Convert barbell weight to the current unit if needed
      const barbellWeightInUnit = unit === 'lbs' ? convertWeight(barbellWeight, 'kg', 'lbs') : barbellWeight;
      // The weight input is per side, so multiply by 2 and add barbell
      const totalWeight = roundToValidIncrement((exercise.weight || 0) * 2 + barbellWeightInUnit);
      return totalWeight;
    }
    
    return roundToValidIncrement(exercise.weight || 0);
  }, [barbellWeight, unit, convertWeight, roundToValidIncrement]);

  const saveWorkout = useCallback(async (id: string, date: Date, comment?: string) => {
    if (!user) return;

    const exercise = exercises.find(e => e.id === id);
    if (!exercise) return;

    const totalWeight = calculateTotalWeight(exercise);
    const weightInKg = unit === 'lbs' ? convertWeight(totalWeight, 'lbs', 'kg') : totalWeight;

    if (totalWeight !== 0 || (exercise.name === 'Chin Ups' && exercise.chinUpType === 'bodyweight')) {
      try {
        const response = await fetch('/api/exercises', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'save_workout',
            exercise: {
              id,
              date,
              weight: weightInKg,
              sets: exercise.sets,
              reps: exercise.reps,
              comment
            }
          })
        });

        if (!response.ok) throw new Error('Failed to save workout');

        const { entry } = await response.json();
        
        setExercises(prev =>
          prev.map(ex => {
            if (ex.id !== id) return ex;
            
            const newEntry = {
              date,
              weight: weightInKg,
              sets: exercise.sets,
              reps: exercise.reps,
              comment
            };

            const existingEntryIndex = ex.history?.findIndex(
              entry => entry.date.toDateString() === date.toDateString()
            );

            let newHistory = [...(ex.history || [])];
            
            if (existingEntryIndex !== undefined && existingEntryIndex >= 0) {
              newHistory[existingEntryIndex] = newEntry;
            } else {
              newHistory = [newEntry, ...newHistory];
            }

            return {
              ...ex,
              history: newHistory,
              lastSaved: date,
            };
          })
        );
      } catch (error) {
        console.error('Failed to save workout:', error);
      }
    }
  }, [exercises, calculateTotalWeight, unit, convertWeight, user]);

  return {
    exercises,
    loading,
    addExercise,
    updateExercise,
    deleteExercise,
    toggleExercise,
    calculateTotalWeight,
    saveWorkout,
  };
};
