'use client';

import { useState, useMemo, useCallback } from 'react';
import { Exercise, WorkoutEntry } from '../lib/types';
import { useExercises } from '../lib/hooks/useExercises';
import DatePicker from 'react-datepicker';
import { Combobox } from '@headlessui/react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Area } from 'recharts';
import { ChevronUpIcon, ChevronDownIcon, PlusIcon, ChevronLeftIcon, ChevronRightIcon, ChatBubbleLeftIcon as CommentIcon, ArrowsUpDownIcon } from '@heroicons/react/24/solid';
import "react-datepicker/dist/react-datepicker.css";
import { Logo } from './Logo';
import { useSettings } from '../lib/contexts/SettingsContext';

export const ExerciseTracker = () => {
  const { exercises, addExercise, updateExercise, deleteExercise, toggleExercise, calculateTotalWeight, saveWorkout } = useExercises();
  const { unit, barbellWeight, convertWeight, displayWeight } = useSettings();
  const [newExerciseName, setNewExerciseName] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showAddExercise, setShowAddExercise] = useState(false);
  const [exerciseToDelete, setExerciseToDelete] = useState<string | null>(null);
  const [showSecondConfirmation, setShowSecondConfirmation] = useState(false);
  const [showSetLogger, setShowSetLogger] = useState<string | null>(null);
  const [tempSets, setTempSets] = useState<{ reps: number; weight?: number }[]>([]);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [editingExerciseId, setEditingExerciseId] = useState<string | null>(null);
  const [weightInputMode, setWeightInputMode] = useState<'perSide' | 'total'>('perSide');
  const [isExerciseListExpanded, setIsExerciseListExpanded] = useState(true);
  const [totalWeightInput, setTotalWeightInput] = useState<string>('');

  const RESISTANCE_BANDS = [
    { color: 'Purple', assistance: 23 },
    { color: 'Red', assistance: 16 },
    { color: 'Black', assistance: 11 },
    { color: 'Green', assistance: 7 },
    { color: 'Blue', assistance: 4 },
  ];

  // Get all unique workout dates across all exercises
  const workoutDates = useMemo(() => {
    const dates = new Set<string>();
    exercises.forEach(exercise => {
      exercise.history?.forEach(entry => {
        dates.add(entry.date.toDateString());
      });
    });
    return dates;
  }, [exercises]);

  // Custom day class for the date picker
  const dayClassNames = (date: Date): string => {
    return workoutDates.has(date.toDateString())
      ? "bg-green-100 hover:bg-green-200 rounded-full"
      : "";
  };

  // Add custom styles for the calendar
  const calendarClassName = "workout-calendar";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newExerciseName.trim()) {
      addExercise(newExerciseName.trim());
      setNewExerciseName('');
      setShowAddExercise(false);
    }
  };

  // Calculate trend for an exercise over a specified number of days
  const calculateTrend = (exercise: Exercise, days: number) => {
    if (!exercise.history || exercise.history.length < 2) return { percentage: 0, isPositive: false };
    
    const recentEntries = exercise.history
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .filter(entry => {
        const entryDate = new Date(entry.date);
        const daysAgo = new Date();
        daysAgo.setDate(daysAgo.getDate() - days);
        return entryDate >= daysAgo;
      });
    
    if (recentEntries.length < 2) return { percentage: 0, isPositive: false };
    
    const oldestWeight = recentEntries[recentEntries.length - 1].weight;
    const newestWeight = recentEntries[0].weight;
    const percentage = ((newestWeight - oldestWeight) / oldestWeight) * 100;
    
    return {
      percentage: Math.abs(Math.round(percentage * 10) / 10),
      isPositive: percentage > 0
    };
  };

  const isPB = (exercise: Exercise): boolean => {
    if (!exercise.history || exercise.history.length === 0) return false;
    const currentWeight = calculateTotalWeight(exercise);
    return !exercise.history.some(entry => entry.weight > currentWeight);
  };

  // Sort history entries by date for the graph
  const getSortedHistory = (history: WorkoutEntry[] | undefined) => {
    if (!history) return [];
    return [...history]
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map(entry => ({
        ...entry,
        // Convert stored kg weight to current unit for display
        weight: unit === 'lbs' ? convertWeight(entry.weight, 'kg', 'lbs') : entry.weight
      }));
  };

  const calculateWarmupSets = useCallback(
    (workWeight: number, useBarbell: boolean, exerciseName: string) => {
      // Skip warm-up sets for these exercises
      if (['Chin Ups', 'Deadlift', 'Back Extension'].includes(exerciseName)) return null;
      
      // Convert barbell weight to the current unit
      const barbellWeightInUnit = unit === 'lbs' ? convertWeight(barbellWeight, 'kg', 'lbs') : barbellWeight;
      
      // Calculate the weight without barbell for percentage calculations
      const baseWeight = useBarbell ? workWeight - barbellWeightInUnit : workWeight;
      
      const warmupSets = [
        ...(useBarbell ? [{ sets: 2, reps: 5, percent: 0 }] : []),    // Empty bar (only for barbell)
        { sets: 1, reps: 5, percent: 0.4 },    // 40%
        { sets: 1, reps: 3, percent: 0.6 },    // 60%
        { sets: 1, reps: 2, percent: 0.8 },    // 80%
        { sets: 1, reps: 1, percent: 0.9 },    // 90%
      ];

      return warmupSets.map(set => {
        if (useBarbell) {
          // Empty bar set
          if (set.percent === 0) {
            return {
              sets: set.sets,
              reps: set.reps,
              weight: Math.round(barbellWeightInUnit),
              weightPerSide: 0,
              percent: set.percent
            };
          }

          // Calculate target weight based on percentage of working weight (excluding barbell)
          const targetAdditionalWeight = Math.round(baseWeight * set.percent);
          const weightPerSide = Math.round(targetAdditionalWeight / 2);
          
          // Calculate total weight by adding barbell weight
          const totalWeight = Math.round(barbellWeightInUnit + (weightPerSide * 2));

          return {
            sets: set.sets,
            reps: set.reps,
            weight: totalWeight,
            weightPerSide: weightPerSide,
            percent: set.percent
          };
        } else {
          // Non-barbell exercise
          const totalWeight = Math.round(workWeight * set.percent);
          return {
            sets: set.sets,
            reps: set.reps,
            weight: totalWeight,
            weightPerSide: 0,
            percent: set.percent
          };
        }
      });
    },
    [unit, barbellWeight, convertWeight]
  );

  // Update the weight calculation for chin-ups
  const calculateChinUpWeight = (exercise: Exercise): number => {
    if (!exercise.chinUpType) return 0;
    
    switch (exercise.chinUpType) {
      case 'bodyweight':
        return 0;
      case 'weighted':
        return exercise.weight; // Positive weight for added weight
      case 'assisted-machine':
      case 'assisted-bands':
        return -Math.abs(exercise.weight); // Negative weight for assistance
      default:
        return 0;
    }
  };

  // Function to determine if a specific entry is a PB
  const isEntryPB = (exercise: Exercise, entry: WorkoutEntry): boolean => {
    if (!exercise.history) return false;
    const entryDate = new Date(entry.date).getTime();
    return !exercise.history.some(
      hist => new Date(hist.date).getTime() < entryDate && hist.weight > entry.weight
    );
  };

  // Custom tooltip component for the graph
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 shadow-lg rounded-lg border border-gray-100">
          <p className="text-sm text-gray-600 mb-1">
            {new Date(label).toLocaleDateString()}
          </p>
          <p className="text-lg font-semibold text-gray-800">
            {Math.round(payload[0].value)} {unit}
          </p>
        </div>
      );
    }
    return null;
  };

  // Custom dot component for the graph
  const CustomDot = ({ cx, cy, payload, exercise }: any) => {
    const isPB = isEntryPB(exercise, payload);
    return (
      <g>
        <circle
          cx={cx}
          cy={cy}
          r={4}
          fill="#3B82F6"
          className="transition-all duration-200 hover:r-6"
        />
        <text
          x={cx}
          y={cy - 10}
          textAnchor="middle"
          fill="#4B5563"
          fontSize="12"
          className="font-medium"
        >
          {Math.round(payload.weight)} {unit}
          {isPB && <tspan x={cx} y={cy - 25} fontSize="14">👑</tspan>}
        </text>
      </g>
    );
  };

  // Get comment for current date and exercise
  const getCurrentComment = (exerciseId: string): string => {
    const exercise = exercises.find(e => e.id === exerciseId);
    const entry = exercise?.history?.find(
      h => h.date.toDateString() === selectedDate.toDateString()
    );
    return entry?.comment || '';
  };

  // Update the saveWorkout function to include comments
  const handleSaveWorkout = (exerciseId: string) => {
    const comment = getCurrentComment(exerciseId);
    saveWorkout(exerciseId, selectedDate, comment);
  };

  return (
    <div className="min-h-screen bg-white p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-center mb-12">
          <Logo />
        </div>

        <div className="mb-8">
          <style jsx global>{`
            .workout-calendar {
              font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto !important;
              border: none !important;
              border-radius: 1rem !important;
              padding: 1rem !important;
              box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1) !important;
              background: white !important;
            }

            .workout-calendar .react-datepicker__header {
              background: transparent !important;
              border-bottom: none !important;
              padding-top: 0 !important;
            }

            .workout-calendar .react-datepicker__current-month {
              font-size: 1.1rem !important;
              font-weight: 500 !important;
              color: #1e40af !important;
              margin-bottom: 0.75rem !important;
            }

            .workout-calendar .react-datepicker__day-name {
              color: #6b7280 !important;
              font-weight: 500 !important;
              width: 2.5rem !important;
              line-height: 2.5rem !important;
              margin: 0.2rem !important;
            }

            .workout-calendar .react-datepicker__day {
              width: 2.5rem !important;
              line-height: 2.5rem !important;
              margin: 0.2rem !important;
              color: #374151 !important;
              font-weight: 400 !important;
              border-radius: 9999px !important;
              transition: all 0.2s !important;
            }

            .workout-calendar .react-datepicker__day:hover {
              background-color: #e0e7ff !important;
              color: #1e40af !important;
            }

            .workout-calendar .react-datepicker__day--selected {
              background: linear-gradient(to right, #3b82f6, #2563eb) !important;
              color: white !important;
              font-weight: 500 !important;
            }

            .workout-calendar .react-datepicker__day--highlighted {
              background-color: #dcfce7 !important;
              border-radius: 9999px !important;
              color: #15803d !important;
            }

            .workout-calendar .react-datepicker__day--highlighted:hover {
              background-color: #bbf7d0 !important;
            }

            .workout-calendar .react-datepicker__day--keyboard-selected {
              background: linear-gradient(to right, #3b82f6, #2563eb) !important;
              color: white !important;
            }

            .workout-calendar .react-datepicker__day--outside-month {
              color: #9ca3af !important;
            }

            .workout-calendar .react-datepicker__navigation {
              top: 1rem !important;
            }

            .workout-calendar .react-datepicker__navigation-icon::before {
              border-color: #6b7280 !important;
              border-width: 2px 2px 0 0 !important;
              height: 8px !important;
              width: 8px !important;
            }

            .workout-calendar .react-datepicker__navigation:hover .react-datepicker__navigation-icon::before {
              border-color: #3b82f6 !important;
            }
          `}</style>
          <div className="relative flex items-center justify-center mb-4">
            <button
              onClick={() => {
                const prevDay = new Date(selectedDate);
                prevDay.setDate(prevDay.getDate() - 1);
                setSelectedDate(prevDay);
              }}
              className="absolute left-0 md:left-4 p-2 text-gray-400 hover:text-blue-500 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-200 rounded-full bg-white shadow-sm z-10"
              aria-label="Previous day"
            >
              <ChevronLeftIcon className="w-6 h-6" />
            </button>
            <DatePicker
              selected={selectedDate}
              onChange={(date: Date | null) => date && setSelectedDate(date)}
              className="text-2xl md:text-3xl font-light text-gray-700 px-4 py-2 border-b border-gray-200 focus:outline-none focus:border-blue-500 w-full text-center"
              dateFormat="MMMM d, yyyy"
              placeholderText="Select workout date"
              dayClassName={dayClassNames}
              highlightDates={Array.from(workoutDates).map(dateStr => new Date(dateStr))}
            />
            <button
              onClick={() => {
                const nextDay = new Date(selectedDate);
                nextDay.setDate(nextDay.getDate() + 1);
                setSelectedDate(nextDay);
              }}
              className="absolute right-0 md:right-4 p-2 text-gray-400 hover:text-blue-500 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-200 rounded-full bg-white shadow-sm z-10"
              aria-label="Next day"
            >
              <ChevronRightIcon className="w-6 h-6" />
            </button>
          </div>

          <div className="relative">
            <div 
              className={`overflow-hidden transition-all duration-300 ease-in-out ${
                isExerciseListExpanded ? 'max-h-96' : 'max-h-0'
              }`}
            >
              <div className="flex items-center gap-3">
                {showAddExercise ? (
                  <div className="w-full">
                    <form onSubmit={handleSubmit} className="flex flex-col gap-2 bg-white p-4 rounded-lg shadow-sm">
                      <input
                        type="text"
                        value={newExerciseName}
                        onChange={(e) => setNewExerciseName(e.target.value)}
                        placeholder="Exercise name..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 text-black text-sm"
                        autoFocus
                      />
                      <div className="flex gap-2 justify-end">
                        <button
                          type="button"
                          onClick={() => setShowAddExercise(false)}
                          className="px-4 py-2 text-gray-600 hover:text-gray-800"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                        >
                          Add
                        </button>
                      </div>
                    </form>
                  </div>
                ) : (
                  <>
                    <div className="flex-1 flex flex-wrap gap-2">
                      {exercises.map((exercise) => (
                        <button
                          key={exercise.id}
                          onClick={() => toggleExercise(exercise.id)}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                            exercise.isSelected
                              ? 'bg-blue-100 text-blue-700 shadow-sm'
                              : 'bg-gray-100 text-gray-600'
                          } flex items-center`}
                        >
                          <span className="truncate">{exercise.name}</span>
                          {!exercise.isDefault && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setExerciseToDelete(exercise.id);
                                setShowSecondConfirmation(false);
                              }}
                              className="ml-2 text-xs text-gray-400 hover:text-red-500"
                            >
                              ×
                            </button>
                          )}
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={() => setShowAddExercise(true)}
                      className="shrink-0 text-sm text-gray-400 hover:text-gray-600 font-light flex items-center gap-1 px-3 py-2"
                    >
                      <PlusIcon className="w-4 h-4" />
                      <span className="hidden sm:inline">Add Exercise</span>
                      <span className="sm:hidden">Add</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="flex justify-center -mb-3 mt-2 relative z-10">
              <button
                onClick={() => setIsExerciseListExpanded(!isExerciseListExpanded)}
                className="group relative px-12 py-1 hover:text-blue-500 transition-colors duration-200 focus:outline-none"
                aria-label={isExerciseListExpanded ? "Collapse exercise list" : "Expand exercise list"}
              >
                <div className="absolute left-0 top-1/2 w-8 h-px bg-gradient-to-r from-gray-200 to-transparent" />
                <div className="absolute right-0 top-1/2 w-8 h-px bg-gradient-to-l from-gray-200 to-transparent" />
                {isExerciseListExpanded ? (
                  <ChevronUpIcon className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-all duration-200 transform group-hover:-translate-y-0.5" />
                ) : (
                  <ChevronDownIcon className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-all duration-200 transform group-hover:translate-y-0.5" />
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="grid gap-6">
          {exercises
            .filter((exercise) => exercise.isSelected)
            .map((exercise) => (
            <div
              key={exercise.id}
              className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:border-blue-100 transition-all duration-200 hover:shadow-md"
            >
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Exercise Info Column */}
                <div className="lg:col-span-2">
                  <h2 className="text-xl font-semibold text-gray-800 mb-4">{exercise.name}</h2>

                  {/* Show comment if it exists for the current date */}
                  {exercise.history?.find(h => h.date.toDateString() === selectedDate.toDateString())?.comment && (
                    <div className="mb-4 p-3 bg-gray-50 rounded-lg text-sm text-gray-600 border border-gray-100">
                      {exercise.history.find(h => h.date.toDateString() === selectedDate.toDateString())?.comment}
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="relative p-4 bg-gray-50 rounded-lg">
                        {exercise.name === 'Chin Ups' ? (
                          <div className="space-y-4">
                            <div className="flex gap-4">
                              <div className="flex-1">
                                <label className="block text-sm font-medium text-gray-600 mb-2">Type</label>
                                <select
                                  value={exercise.chinUpType || 'bodyweight'}
                                  onChange={(e) => {
                                    const value = e.target.value as 'bodyweight' | 'weighted' | 'assisted-machine' | 'assisted-bands';
                                    updateExercise(exercise.id, { 
                                      chinUpType: value,
                                      weight: 0,
                                      assistanceBand: undefined
                                    });
                                  }}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 text-black"
                                >
                                  <option value="bodyweight">Bodyweight</option>
                                  <option value="weighted">Weighted (+kg)</option>
                                  <option value="assisted-machine">Assisted - Machine</option>
                                  <option value="assisted-bands">Assisted - Resistance Bands</option>
                                </select>
                              </div>
                              {exercise.chinUpType === 'weighted' && (
                                <div className="flex-1">
                                  <label className="block text-sm font-medium text-gray-600 mb-2">
                                    Added Weight (kg)
                                  </label>
                                  <input
                                    type="number"
                                    step="any"
                                    value={exercise.weight || ''}
                                    onChange={(e) => {
                                      updateExercise(exercise.id, { 
                                        weight: e.target.value === '' ? 0 : Number(e.target.value)
                                      });
                                    }}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 text-black text-center"
                                    min="0"
                                    inputMode="numeric"
                                  />
                                </div>
                              )}
                              {exercise.chinUpType === 'assisted-machine' && (
                                <div className="flex-1">
                                  <label className="block text-sm font-medium text-gray-600 mb-2">
                                    Machine Assistance (kg)
                                  </label>
                                  <input
                                    type="number"
                                    step="any"
                                    value={exercise.weight || ''}
                                    onChange={(e) => {
                                      updateExercise(exercise.id, { 
                                        weight: e.target.value === '' ? 0 : Number(e.target.value)
                                      });
                                    }}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 text-black text-center"
                                    min="0"
                                    inputMode="numeric"
                                  />
                                </div>
                              )}
                              {exercise.chinUpType === 'assisted-bands' && (
                                <div className="flex-1">
                                  <label className="block text-sm font-medium text-gray-600 mb-2">
                                    Resistance Band
                                  </label>
                                  <select
                                    value={exercise.assistanceBand || ''}
                                    onChange={(e) => {
                                      const band = RESISTANCE_BANDS.find(b => b.color === e.target.value);
                                      updateExercise(exercise.id, {
                                        assistanceBand: e.target.value,
                                        weight: band?.assistance || 0
                                      });
                                    }}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 text-black"
                                  >
                                    <option value="">Select band</option>
                                    {RESISTANCE_BANDS.map(band => (
                                      <option key={band.color} value={band.color}>
                                        {band.color} (~{band.assistance}kg assist)
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              )}
                            </div>
                            <div className="text-sm text-gray-500 bg-white p-3 rounded-lg border border-gray-100">
                              {exercise.chinUpType === 'bodyweight' && "Track your bodyweight chin-ups"}
                              {exercise.chinUpType === 'weighted' && `Adding ${exercise.weight || 0}kg to bodyweight`}
                              {exercise.chinUpType === 'assisted-machine' && `Using ${exercise.weight || 0}kg of machine assistance`}
                              {exercise.chinUpType === 'assisted-bands' && exercise.assistanceBand && 
                                `Using ${exercise.assistanceBand} band (~${RESISTANCE_BANDS.find(b => b.color === exercise.assistanceBand)?.assistance || 0}kg assist)`}
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col gap-4 mb-2">
                            <div className="flex items-center justify-center mb-2">
                              <label className="flex items-center space-x-2 text-sm font-medium text-gray-600">
                                <input
                                  type="checkbox"
                                  checked={exercise.useBarbell}
                                  onChange={(e) => {
                                    updateExercise(exercise.id, { 
                                      useBarbell: e.target.checked,
                                      weight: 0 // Reset weight when toggling barbell
                                    });
                                  }}
                                  className="rounded text-blue-500 focus:ring-blue-200"
                                />
                                <span>Use Barbell ({displayWeight(barbellWeight)})</span>
                              </label>
                            </div>

                            {exercise.useBarbell ? (
                              <>
                                <div className="group relative">
                                  <label className="block text-sm font-medium text-gray-600 mb-1">
                                    Weight per side ({unit})
                                  </label>
                                  {weightInputMode === 'perSide' ? (
                                    <input
                                      type="number"
                                      step="any"
                                      value={exercise.weight || ''}
                                      onChange={(e) => {
                                        const value = e.target.value;
                                        updateExercise(exercise.id, { 
                                          weight: value === '' ? 0 : Number(value)
                                        });
                                      }}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 text-black text-center"
                                      inputMode="numeric"
                                    />
                                  ) : (
                                    <div className="w-full px-3 py-2 bg-gray-50 rounded-lg text-center text-gray-700">
                                      {(() => {
                                        const barbellWeightInUnit = unit === 'lbs' ? convertWeight(barbellWeight, 'kg', 'lbs') : barbellWeight;
                                        const weightPerSide = (calculateTotalWeight(exercise) - barbellWeightInUnit) / 2;
                                        // Round to nearest 0.5
                                        return Math.round(weightPerSide * 2) / 2;
                                      })()}
                                    </div>
                                  )}
                                </div>

                                <button
                                  onClick={() => setWeightInputMode(mode => mode === 'perSide' ? 'total' : 'perSide')}
                                  className="flex items-center justify-center w-8 h-8 mx-auto my-1 text-gray-400 hover:text-blue-500 transition-colors duration-200"
                                  title="Switch input mode"
                                >
                                  <ArrowsUpDownIcon className="w-5 h-5" />
                                </button>

                                <div className="group relative">
                                  {weightInputMode === 'total' ? (
                                    <div className="group relative">
                                      <label className="block text-sm font-medium text-gray-600 mb-1">
                                        Total Weight ({unit})
                                      </label>
                                      <input
                                        type="number"
                                        step="0.25"
                                        value={totalWeightInput}
                                        onChange={(e) => {
                                          setTotalWeightInput(e.target.value);
                                          const barbellWeightInUnit = unit === 'lbs' ? convertWeight(barbellWeight, 'kg', 'lbs') : barbellWeight;
                                          
                                          if (e.target.value === '') {
                                            updateExercise(exercise.id, { weight: 0 });
                                            return;
                                          }
                                          
                                          const totalWeight = Number(e.target.value);
                                          if (isNaN(totalWeight) || totalWeight < barbellWeightInUnit) {
                                            return;
                                          }
                                          
                                          const weightPerSide = (totalWeight - barbellWeightInUnit) / 2;
                                          const roundedWeightPerSide = Math.round(weightPerSide * 2) / 2;
                                          updateExercise(exercise.id, { weight: roundedWeightPerSide });
                                        }}
                                        onFocus={() => {
                                          setTotalWeightInput(calculateTotalWeight(exercise).toString());
                                        }}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 text-black text-center"
                                        placeholder={unit === 'lbs' ? convertWeight(barbellWeight, 'kg', 'lbs').toString() : barbellWeight.toString()}
                                        inputMode="decimal"
                                      />
                                      <div className="text-xs text-gray-500 mt-1 text-center">
                                        Includes {displayWeight(barbellWeight)} barbell weight
                                      </div>
                                      {Number(calculateTotalWeight(exercise)) < barbellWeight && (
                                        <div className="text-xs text-red-500 mt-1 text-center">
                                          Weight cannot be less than the barbell ({displayWeight(barbellWeight)})
                                        </div>
                                      )}
                                    </div>
                                  ) : (
                                    <div className="group relative">
                                      <label className="block text-sm font-medium text-gray-600 mb-1">
                                        Total Weight ({unit})
                                      </label>
                                      <div className="w-full px-3 py-2 bg-gray-50 rounded-lg text-center text-gray-700">
                                        {calculateTotalWeight(exercise)}
                                      </div>
                                      <div className="text-xs text-gray-500 mt-1 text-center">
                                        Includes {displayWeight(barbellWeight)} barbell weight
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </>
                            ) : (
                              <div className="group relative">
                                <label className="block text-sm font-medium text-gray-600 mb-1">
                                  Total Weight ({unit})
                                </label>
                                <input
                                  type="number"
                                  step="any"
                                  value={exercise.weight || ''}
                                  onChange={(e) => {
                                    const value = e.target.value;
                                    updateExercise(exercise.id, { 
                                      weight: value === '' ? 0 : Number(value)
                                    });
                                  }}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 text-black text-center"
                                  inputMode="numeric"
                                />
                              </div>
                            )}
                          </div>
                        )}

                        {!exercise.isCustom && exercise.weight > 0 && (
                          <div className="mt-4 text-sm border-t border-gray-200 pt-4">
                            <div className="mb-3 text-gray-600 font-medium flex items-center gap-2">
                              <span>Warm-up Sets</span>
                              <span className="text-xs text-gray-400">
                                (before {exercise.sets}×{exercise.reps} @ {Math.round(calculateTotalWeight(exercise))} {unit})
                              </span>
                            </div>
                            {calculateWarmupSets(calculateTotalWeight(exercise), exercise.useBarbell, exercise.name)?.map((set, index) => (
                              <div key={index} className="flex items-center justify-between text-gray-500 mb-1 last:mb-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{set.sets}×{set.reps}</span>
                                  <span>@</span>
                                  <span>{Math.round(set.weight)} {unit}</span>
                                  {exercise.useBarbell && set.weightPerSide > 0 && (
                                    <span className="text-xs text-gray-400">
                                      ({Math.round(set.weightPerSide * 2) / 2} {unit} per side)
                                    </span>
                                  )}
                                  {!exercise.useBarbell && set.percent > 0 && (
                                    <span className="text-xs text-gray-400">
                                      ({Math.round(set.percent * 100)}%)
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <div className="text-left">
                            <span className="text-2xl font-bold text-gray-700">
                              {exercise.sets}
                            </span>
                            <span className="text-sm text-gray-500 ml-1">sets</span>
                          </div>
                          <button
                            onClick={() => {
                              setShowSetLogger(exercise.id);
                              setTempSets(exercise.actualSets || Array(exercise.sets).fill({ reps: exercise.reps }));
                            }}
                            className="text-sm text-blue-500 hover:text-blue-700"
                          >
                            {exercise.actualSets ? 'Edit actual sets' : 'Log actual sets'}
                          </button>
                        </div>

                        <input
                          type="range"
                          min="1"
                          max="10"
                          value={exercise.sets}
                          onChange={(e) =>
                            updateExercise(exercise.id, { sets: Number(e.target.value) })
                          }
                          className="w-full h-2 bg-blue-100 rounded-lg appearance-none cursor-pointer accent-blue-500"
                        />
                        <div className="flex justify-between px-1 mt-1">
                          <span className="text-xs text-gray-400">1</span>
                          <span className="text-xs text-gray-400">10</span>
                        </div>
                        {exercise.actualSets && (
                          <div className="mt-2 text-sm text-gray-600">
                            Actual sets: {exercise.actualSets.map(set => set.reps).join(', ')} reps
                            <span className="ml-2 text-xs text-gray-400">
                              (Total: {exercise.actualSets.reduce((sum, set) => sum + set.reps, 0)} reps)
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="relative">
                        <div className="text-left mb-2">
                          <span className="text-2xl font-bold text-gray-700">
                            {exercise.reps}
                          </span>
                          <span className="text-sm text-gray-500 ml-1">reps per set</span>
                        </div>
                        <input
                          type="range"
                          min="1"
                          max="20"
                          value={exercise.reps}
                          onChange={(e) =>
                            updateExercise(exercise.id, { reps: Number(e.target.value) })
                          }
                          className="w-full h-2 bg-blue-100 rounded-lg appearance-none cursor-pointer accent-blue-500"
                        />
                        <div className="flex justify-between px-1 mt-1">
                          <span className="text-xs text-gray-400">1</span>
                          <span className="text-xs text-gray-400">20</span>
                        </div>
                      </div>

                      <div className="flex gap-2 items-center">
                        <button
                          onClick={() => {
                            handleSaveWorkout(exercise.id);
                          }}
                          className="flex-1 group relative px-6 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-base font-medium rounded-lg hover:from-blue-600 hover:to-blue-700 transform hover:scale-105 transition-all duration-200 shadow-md hover:shadow-lg"
                        >
                          <span className="group-hover:hidden">Immortalize Gains 💪</span>
                          <span className="hidden group-hover:inline">Light Weight Baby! 🏋️‍♂️</span>
                        </button>

                        <button
                          onClick={() => {
                            setShowCommentModal(true);
                            setEditingExerciseId(exercise.id);
                            setCommentText(getCurrentComment(exercise.id));
                          }}
                          className="p-2 text-gray-400 hover:text-blue-500 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-200 rounded-full group relative"
                          aria-label="Add exercise note"
                        >
                          <CommentIcon className="w-6 h-6" />
                          {exercise.history?.find(h => h.date.toDateString() === selectedDate.toDateString())?.comment && (
                            <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full"></div>
                          )}
                          <span className="absolute right-full mr-2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                            {exercise.history?.find(h => h.date.toDateString() === selectedDate.toDateString())?.comment 
                              ? 'Edit note'
                              : 'Add note'}
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Chart Column */}
                <div className="space-y-4">
                  <div className="h-[200px] relative">
                    {exercise.history && exercise.history.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart 
                          data={getSortedHistory(exercise.history)}
                          margin={{ top: 30, right: 10, left: 10, bottom: 5 }}
                        >
                          <defs>
                            <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.1}/>
                              <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <XAxis 
                            dataKey="date" 
                            tickFormatter={(date) => new Date(date).toLocaleDateString()}
                            stroke="#9CA3AF"
                            tick={{ fontSize: 12 }}
                            tickLine={false}
                            axisLine={{ stroke: '#E5E7EB' }}
                          />
                          <YAxis 
                            stroke="#9CA3AF"
                            tick={{ fontSize: 12 }}
                            tickLine={false}
                            axisLine={{ stroke: '#E5E7EB' }}
                            tickFormatter={(value) => `${Math.round(value)} ${unit}`}
                          />
                          <Tooltip content={<CustomTooltip />} />
                          <Area
                            type="monotone"
                            dataKey="weight"
                            stroke="#3B82F6"
                            fillOpacity={1}
                            fill="url(#colorWeight)"
                          />
                          <Line 
                            type="monotone" 
                            dataKey="weight" 
                            stroke="#3B82F6" 
                            strokeWidth={2}
                            dot={(props) => <CustomDot {...props} exercise={exercise} />}
                            activeDot={{ r: 6, fill: "#2563EB" }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-gray-400 bg-gray-50 rounded-lg border border-gray-100">
                        <p className="text-sm">No workout history yet</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-2">
                    {[
                      { days: 7, label: '7d' },
                      { days: 30, label: '30d' },
                      { days: 365, label: '1y' }
                    ].map(({ days, label }) => {
                      const trend = calculateTrend(exercise, days);
                      if (trend.percentage === 0) return null;
                      return (
                        <div key={days} className={`flex items-center gap-1 ${
                          trend.isPositive ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {trend.isPositive ? (
                            <ChevronUpIcon className="w-4 h-4" />
                          ) : (
                            <ChevronDownIcon className="w-4 h-4" />
                          )}
                          <span className="font-medium whitespace-nowrap">
                            {trend.percentage}% ({label})
                          </span>
                        </div>
                      );
                    })}
                    {isPB(exercise) && (
                      <div className="flex items-center gap-1 text-yellow-600">
                        <span>🏋️‍♂️</span>
                        <span className="font-medium">New PB!</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {exerciseToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full">
            <h3 className="text-lg font-semibold mb-4">Delete Exercise?</h3>
            <p className="text-gray-600 mb-6">
              {!showSecondConfirmation ? (
                "This will permanently delete this exercise and all its history. This action cannot be undone."
              ) : (
                "Are you absolutely sure? This is your last chance to keep this exercise and its history."
              )}
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setExerciseToDelete(null);
                  setShowSecondConfirmation(false);
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (!showSecondConfirmation) {
                    setShowSecondConfirmation(true);
                  } else if (exerciseToDelete) {
                    deleteExercise(exerciseToDelete);
                    setExerciseToDelete(null);
                    setShowSecondConfirmation(false);
                  }
                }}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
              >
                {showSecondConfirmation ? "Yes, Delete It" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Set Logger Modal */}
      {showSetLogger && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Log Your Sets</h3>
              <button
                onClick={() => {
                  setShowSetLogger(null);
                  setTempSets([]);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {tempSets.map((set, index) => (
                  <div key={index} className="flex-1 min-w-[100px]">
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Set {index + 1}
                    </label>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={set.reps || ''}
                          onChange={(e) => {
                            const newSets = [...tempSets];
                            newSets[index] = { 
                              ...newSets[index],
                              reps: parseInt(e.target.value) || 0 
                            };
                            setTempSets(newSets);
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 text-black text-center"
                          min="0"
                          max="20"
                          inputMode="numeric"
                          placeholder="Reps"
                        />
                        <span className="text-sm text-gray-500">reps</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={set.weight !== undefined ? set.weight : calculateTotalWeight(exercises.find(e => e.id === showSetLogger)!)}
                          onChange={(e) => {
                            const newSets = [...tempSets];
                            newSets[index] = { 
                              ...newSets[index],
                              weight: parseInt(e.target.value) || 0 
                            };
                            setTempSets(newSets);
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 text-black text-center"
                          min="0"
                          inputMode="numeric"
                          placeholder="Weight"
                        />
                        <span className="text-sm text-gray-500">{unit}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const currentExercise = exercises.find(e => e.id === showSetLogger);
                    setTempSets([...tempSets, { 
                      reps: 0,
                      weight: currentExercise ? calculateTotalWeight(currentExercise) : 0
                    }]);
                  }}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200"
                >
                  Add Set
                </button>
                <button
                  onClick={() => setTempSets(tempSets.slice(0, -1))}
                  disabled={tempSets.length <= 1}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Remove Set
                </button>
              </div>

              <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
                <div className="font-medium mb-1">Summary:</div>
                <div>Total Sets: {tempSets.length}</div>
                <div>Total Reps: {tempSets.reduce((sum, set) => sum + (set.reps || 0), 0)}</div>
                <div>Average Weight: {tempSets.length > 0 ? Math.round(tempSets.reduce((sum, set) => sum + (set.weight || calculateTotalWeight(exercises.find(e => e.id === showSetLogger)!)), 0) / tempSets.length) : 0} {unit}</div>
                <div>Total Weight Lifted: {tempSets.reduce((sum, set) => {
                  const weight = set.weight || calculateTotalWeight(exercises.find(e => e.id === showSetLogger)!);
                  return sum + (weight * (set.reps || 0));
                }, 0)} {unit}</div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  onClick={() => {
                    setShowSetLogger(null);
                    setTempSets([]);
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (showSetLogger) {
                      const validSets = tempSets.filter(set => set.reps > 0);
                      if (validSets.length > 0) {
                        updateExercise(showSetLogger, { actualSets: validSets });
                      } else {
                        updateExercise(showSetLogger, { actualSets: undefined });
                      }
                      setShowSetLogger(null);
                      setTempSets([]);
                    }
                  }}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  Save Sets
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Comment Modal */}
      {showCommentModal && editingExerciseId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Workout Note</h3>
              <button
                onClick={() => {
                  setShowCommentModal(false);
                  setEditingExerciseId(null);
                  setCommentText('');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-4">
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Add notes about your workout (how you felt, any issues, etc.)"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 text-black min-h-[100px] resize-none"
              />

              <div className="flex justify-end gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowCommentModal(false);
                    setEditingExerciseId(null);
                    setCommentText('');
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (editingExerciseId) {
                      saveWorkout(editingExerciseId, selectedDate, commentText);
                      setShowCommentModal(false);
                      setEditingExerciseId(null);
                      setCommentText('');
                    }
                  }}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  Save Note
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
