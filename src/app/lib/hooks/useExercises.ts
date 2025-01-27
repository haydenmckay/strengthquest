'use client';

import { useState, useCallback, useEffect } from 'react';
import { Exercise, DEFAULT_EXERCISES, WorkoutEntry } from '../types';
import { useSettings } from '../contexts/SettingsContext';
import { v4 as uuidv4 } from 'uuid';

export const useExercises = () => {
  const [exercises, setExercises] = useState<Exercise[]>(() => {
    const savedExercises = typeof window !== 'undefined' ? localStorage.getItem('exercises') : null;
    return savedExercises 
      ? JSON.parse(savedExercises).map((exercise: Exercise) => ({
          ...exercise,
          history: exercise.history?.map(entry => ({
            ...entry,
            date: new Date(entry.date)
          }))
        }))
      : DEFAULT_EXERCISES.map(exercise => ({ ...exercise, id: uuidv4() }));
  });

  const { barbellWeight, unit, convertWeight } = useSettings();

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

  // Save exercises to localStorage whenever they change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('exercises', JSON.stringify(exercises));
    }
  }, [exercises]);

  const addExercise = useCallback((name: string) => {
    setExercises(prev => [
      ...prev,
      {
        id: uuidv4(),
        name,
        sets: 3,
        reps: 5,
        weight: 0,
        useBarbell: false,
        canUseBarbell: true, // Allow custom exercises to use barbell by default
        isSelected: true,
        isCustom: true,
      }
    ]);
  }, []);

  const updateExercise = useCallback((id: string, updates: Partial<Exercise>) => {
    setExercises(prev => 
      prev.map(exercise => 
        exercise.id === id ? { ...exercise, ...updates } : exercise
      )
    );
  }, []);

  const deleteExercise = useCallback((id: string) => {
    setExercises(prev => prev.filter(exercise => exercise.id !== id));
  }, []);

  const toggleExercise = useCallback((id: string) => {
    setExercises(prev => 
      prev.map(exercise => 
        exercise.id === id ? { ...exercise, isSelected: !exercise.isSelected } : exercise
      )
    );
  }, []);

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

  const saveWorkout = useCallback((id: string, date: Date, comment?: string) => {
    setExercises((prev) =>
      prev.map((exercise) => {
        if (exercise.id !== id) return exercise;

        const totalWeight = calculateTotalWeight(exercise);
        
        // Convert weight to kg for storage if currently in lbs
        const weightInKg = unit === 'lbs' ? convertWeight(totalWeight, 'lbs', 'kg') : totalWeight;

        // Only add to history if there's a weight value or it's bodyweight chin-ups
        if (totalWeight !== 0 || (exercise.name === 'Chin Ups' && exercise.chinUpType === 'bodyweight')) {
          const newEntry: WorkoutEntry = {
            date,
            weight: weightInKg,
            sets: exercise.sets,
            reps: exercise.reps,
            comment
          };

          // Check if we already have an entry for this date
          const existingEntryIndex = exercise.history?.findIndex(
            entry => entry.date.toDateString() === date.toDateString()
          );

          let newHistory = [...(exercise.history || [])];
          
          if (existingEntryIndex !== undefined && existingEntryIndex >= 0) {
            // Update existing entry
            newHistory[existingEntryIndex] = newEntry;
          } else {
            // Add new entry
            newHistory = [newEntry, ...newHistory];
          }

          return {
            ...exercise,
            history: newHistory,
            lastSaved: date,
          };
        }

        return exercise;
      })
    );
  }, [calculateTotalWeight, unit, convertWeight]);

  return {
    exercises,
    addExercise,
    updateExercise,
    deleteExercise,
    toggleExercise,
    calculateTotalWeight,
    saveWorkout,
  };
};
