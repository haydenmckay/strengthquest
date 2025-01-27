import { prisma } from './prisma';

export async function migrateUserData(userId: string, exercises: any[], workoutHistory: any[]) {
  try {
    // First, create all exercises
    const exerciseMap = new Map();
    
    for (const exercise of exercises) {
      const newExercise = await prisma.exercise.create({
        data: {
          id: exercise.id, // Keep the same ID for reference
          name: exercise.name,
          isDefault: exercise.isDefault || false,
          canUseBarbell: exercise.canUseBarbell || false,
          userId: userId
        }
      });
      exerciseMap.set(exercise.id, newExercise);
    }

    // Then, create all workout entries
    for (const entry of workoutHistory) {
      await prisma.workoutEntry.create({
        data: {
          date: new Date(entry.date),
          weight: entry.weight,
          reps: entry.reps,
          sets: entry.sets,
          comments: entry.comments || '',
          exerciseId: entry.exerciseId,
          userId: userId
        }
      });
    }

    return true;
  } catch (error) {
    console.error('Migration error:', error);
    return false;
  }
} 