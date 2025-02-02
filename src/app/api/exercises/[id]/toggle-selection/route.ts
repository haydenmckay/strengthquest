import { NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';
import { getCurrentUser } from '../../../../../lib/auth';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Get the current exercise
    const exercise = await prisma.exercise.findUnique({
      where: { id: params.id }
    });

    if (!exercise) {
      return NextResponse.json({ error: 'Exercise not found' }, { status: 404 });
    }

    // Toggle the selection state
    const updated = await prisma.$executeRaw`
      UPDATE "Exercise"
      SET "isSelected" = NOT "isSelected"
      WHERE id = ${params.id} AND "userId" = ${user.id}
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to toggle exercise selection:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 