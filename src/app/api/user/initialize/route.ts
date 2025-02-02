import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { getCurrentUser } from '../../../../lib/auth';
import { DEFAULT_EXERCISES, DEFAULT_BARBELL_WEIGHT } from '../../../lib/types';
import crypto from 'crypto';

export async function POST() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Check if user already has exercises
    const existingExercises = await prisma.exercise.findMany({
      where: { userId: user.id }
    });

    // Only initialize if user has no exercises
    if (existingExercises.length === 0) {
      // Initialize or update user settings
      const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: {
          weightUnit: 'kg',
          barbellWeight: DEFAULT_BARBELL_WEIGHT,
        }
      });

      // Create default exercises with all settings preserved using raw SQL
      const exercises = await Promise.all(
        DEFAULT_EXERCISES.map(exercise => 
          prisma.$executeRaw`
            INSERT INTO "Exercise" (
              id,
              name,
              "isDefault",
              "canUseBarbell",
              "useBarbell",
              "isSelected",
              sets,
              reps,
              weight,
              "chinUpType",
              "userId",
              "createdAt",
              "updatedAt"
            ) VALUES (
              ${crypto.randomUUID()},
              ${exercise.name},
              ${exercise.isDefault},
              ${exercise.canUseBarbell},
              ${exercise.useBarbell},
              ${exercise.isSelected},
              ${exercise.sets},
              ${exercise.reps},
              ${exercise.weight},
              ${exercise.chinUpType},
              ${user.id},
              NOW(),
              NOW()
            )
          `
        )
      );

      // Fetch the created exercises to return them
      const createdExercises = await prisma.exercise.findMany({
        where: { userId: user.id }
      });

      return NextResponse.json({
        user: updatedUser,
        exercises: createdExercises,
        message: 'User data initialized successfully'
      });
    } else {
      // User already has exercises, just return them
      return NextResponse.json({
        exercises: existingExercises,
        message: 'User already initialized'
      });
    }
  } catch (error) {
    console.error('Failed to initialize user data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 