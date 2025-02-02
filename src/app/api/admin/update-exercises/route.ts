import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { getCurrentUser } from '../../../../lib/auth';

const BARBELL_EXERCISES = ['Squat', 'Deadlift', 'Bench Press', 'Shoulder Press', 'Power Clean'];
const PRESELECTED_EXERCISES = ['Squat', 'Deadlift'];

export async function POST() {
  try {
    const user = await getCurrentUser();
    if (!user?.email?.includes('admin')) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 401 });
    }

    // Update barbell settings for all users
    await prisma.$transaction([
      // Set useBarbell true for barbell exercises
      prisma.$executeRaw`
        UPDATE "Exercise"
        SET "useBarbell" = true
        WHERE name = ANY(${BARBELL_EXERCISES}::text[])
      `,
      // Set isSelected true for preselected exercises
      prisma.$executeRaw`
        UPDATE "Exercise"
        SET "isSelected" = true
        WHERE name = ANY(${PRESELECTED_EXERCISES}::text[])
      `
    ]);

    return NextResponse.json({
      message: 'Exercise settings updated successfully'
    });
  } catch (error) {
    console.error('Failed to update exercise settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 