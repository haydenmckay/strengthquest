import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, createSession } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const { email, password, name } = await request.json();

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 400 }
      );
    }

    // Create user
    const hashedPassword = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        exercises: {
          create: [
            { name: 'Squat', isDefault: true, canUseBarbell: true },
            { name: 'Deadlift', isDefault: true, canUseBarbell: true },
            { name: 'Bench Press', isDefault: true, canUseBarbell: true },
            { name: 'Shoulder Press', isDefault: true, canUseBarbell: true },
            { name: 'Power Clean', isDefault: true, canUseBarbell: true },
            { name: 'Chin Ups', isDefault: true, canUseBarbell: false },
            { name: 'Back Extension', isDefault: true, canUseBarbell: false }
          ]
        }
      },
      select: {
        id: true,
        email: true,
        name: true,
        weightUnit: true,
        barbellWeight: true
      }
    });

    // Create session
    await createSession(user.id);

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 