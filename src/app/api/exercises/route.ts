import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { getCurrentUser } from '../../../lib/auth';
import { Exercise } from '../../lib/types';
import { Prisma } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const exercises = await prisma.exercise.findMany({
      where: { userId: user.id },
      include: {
        workoutEntries: {
          orderBy: { date: 'desc' }
        }
      }
    });

    return NextResponse.json({ exercises });
  } catch (error) {
    console.error('Failed to fetch exercises:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { exercise, type } = await request.json();

    switch (type) {
      case 'create':
        const created = await prisma.exercise.create({
          data: {
            name: exercise.name,
            isDefault: exercise.isDefault || false,
            canUseBarbell: exercise.canUseBarbell || false,
            isSelected: exercise.isSelected || false,
            useBarbell: exercise.useBarbell || false,
            sets: exercise.sets || 3,
            reps: exercise.reps || 5,
            weight: exercise.weight || 0,
            chinUpType: exercise.chinUpType,
            userId: user.id
          }
        });
        return NextResponse.json({ exercise: created });

      case 'update':
        if (exercise.isSelected !== undefined) {
          // Update isSelected using raw SQL
          await prisma.$executeRaw`
            UPDATE "Exercise"
            SET "isSelected" = ${exercise.isSelected}
            WHERE id = ${exercise.id}
          `;
        }

        // Update other fields using Prisma's typed API
        const updateData = {
          ...(exercise.name !== undefined && { name: exercise.name }),
          ...(exercise.canUseBarbell !== undefined && { canUseBarbell: exercise.canUseBarbell }),
          ...(exercise.useBarbell !== undefined && { useBarbell: exercise.useBarbell }),
          ...(exercise.sets !== undefined && { sets: exercise.sets }),
          ...(exercise.reps !== undefined && { reps: exercise.reps }),
          ...(exercise.weight !== undefined && { weight: exercise.weight }),
          ...(exercise.chinUpType !== undefined && { chinUpType: exercise.chinUpType })
        };

        // Only update if there are fields to update
        const updated = Object.keys(updateData).length > 0 
          ? await prisma.exercise.update({
              where: { id: exercise.id },
              data: updateData
            })
          : await prisma.exercise.findUnique({
              where: { id: exercise.id }
            });

        if (!updated) {
          throw new Error('Exercise not found');
        }

        return NextResponse.json({ exercise: updated });

      case 'delete':
        await prisma.exercise.delete({
          where: { id: exercise.id }
        });
        return NextResponse.json({ success: true });

      case 'save_workout':
        const entry = await prisma.workoutEntry.create({
          data: {
            date: new Date(exercise.date),
            weight: exercise.weight,
            sets: exercise.sets,
            reps: exercise.reps,
            comments: exercise.comment,
            exerciseId: exercise.id,
            userId: user.id
          }
        });
        return NextResponse.json({ entry });

      default:
        return NextResponse.json(
          { error: 'Invalid operation type' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Failed to handle exercise operation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 