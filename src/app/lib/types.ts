export type ChinUpType = 'bodyweight' | 'weighted' | 'assisted-machine' | 'assisted-bands';

export interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: number;
  weight: number;
  useBarbell: boolean;
  canUseBarbell: boolean;  // Flag to indicate if the exercise can use a barbell
  isSelected: boolean;
  isCustom: boolean;
  isDefault?: boolean;  // To mark exercises that cannot be deleted
  lastSaved?: Date;
  date?: Date;  // For tracking when the exercise was performed
  history?: WorkoutEntry[];
  actualSets?: { reps: number }[];
  chinUpType?: ChinUpType;
  assistanceBand?: string;
}

export interface WorkoutEntry {
  date: Date;
  weight: number;
  sets: number;
  reps: number;
  comment?: string;  // Optional comment for this workout
}

export const DEFAULT_BARBELL_WEIGHT = 20; // in kg

export const DEFAULT_EXERCISES: Omit<Exercise, 'id'>[] = [
  { 
    name: 'Squat', 
    sets: 3, 
    reps: 5, 
    weight: 0, 
    useBarbell: true, 
    canUseBarbell: true,
    isSelected: true,  // Pre-selected
    isCustom: false, 
    isDefault: true 
  },
  { 
    name: 'Deadlift', 
    sets: 1,
    reps: 5, 
    weight: 0, 
    useBarbell: true, 
    canUseBarbell: true,
    isSelected: true,  // Pre-selected
    isCustom: false, 
    isDefault: true 
  },
  { 
    name: 'Bench Press', 
    sets: 3, 
    reps: 5, 
    weight: 0, 
    useBarbell: true,  // Always use barbell
    canUseBarbell: true,
    isSelected: false, 
    isCustom: false, 
    isDefault: true 
  },
  { 
    name: 'Shoulder Press', 
    sets: 3, 
    reps: 5, 
    weight: 0, 
    useBarbell: true,  // Always use barbell
    canUseBarbell: true,
    isSelected: false, 
    isCustom: false, 
    isDefault: true 
  },
  { 
    name: 'Power Clean', 
    sets: 3, 
    reps: 5, 
    weight: 0, 
    useBarbell: true,  // Always use barbell
    canUseBarbell: true,
    isSelected: false, 
    isCustom: false, 
    isDefault: true 
  },
  { 
    name: 'Chin Ups', 
    sets: 3, 
    reps: 8, 
    weight: 0, 
    useBarbell: false, 
    canUseBarbell: false,
    isSelected: false, 
    isCustom: false, 
    isDefault: true,
    chinUpType: 'bodyweight'
  },
  { 
    name: 'Back Extension', 
    sets: 3, 
    reps: 10, 
    weight: 0, 
    useBarbell: false, 
    canUseBarbell: false,
    isSelected: false, 
    isCustom: false, 
    isDefault: true 
  }
];

export const RESISTANCE_BANDS = [
  { name: 'Purple (Light)', assistance: 5 },
  { name: 'Green (Medium)', assistance: 10 },
  { name: 'Blue (Heavy)', assistance: 15 },
  { name: 'Black (X-Heavy)', assistance: 20 },
] as const;
