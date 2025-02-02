import { cookies } from 'next/headers'
import { jwtVerify, SignJWT } from 'jose'
import { prisma } from './prisma'
import bcrypt from 'bcryptjs'
import { Resend } from 'resend'
import { v4 as uuidv4 } from 'uuid'
import { nanoid } from 'nanoid'
import { DEFAULT_EXERCISES } from '../app/lib/types'

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'default-secret-key')
const COOKIE_NAME = process.env.COOKIE_NAME || 'auth-token'
const resend = new Resend(process.env.RESEND_API_KEY)

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10)
}

export async function comparePasswords(password: string, hash: string) {
  return bcrypt.compare(password, hash)
}

export async function createMagicLink(email: string) {
  try {
    console.log('Creating magic link for:', email)

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    // Create or get user
    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        email,
        passwordHash: uuidv4(),
        weightUnit: 'kg',
        barbellWeight: 20,
        exercises: {
          create: DEFAULT_EXERCISES.map(exercise => ({
            name: exercise.name,
            isDefault: exercise.isDefault || false,
            canUseBarbell: exercise.canUseBarbell,
            useBarbell: exercise.useBarbell,
            isSelected: exercise.isSelected,
            sets: exercise.sets,
            reps: exercise.reps,
            weight: exercise.weight || 0,
            chinUpType: exercise.chinUpType
          }))
        }
      }
    });
    
    console.log('✓ User created/updated:', user.id);

    // Create token
    const token = await new SignJWT({ userId: user.id })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('15m')
      .sign(JWT_SECRET)
    console.log('✓ Token created')

    // Create magic link
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL
    if (!baseUrl) {
      throw new Error('NEXT_PUBLIC_APP_URL is not configured')
    }
    const magicLink = `${baseUrl}/auth/verify?token=${encodeURIComponent(token)}`
    console.log('✓ Magic link created')

    // Send email
    try {
      const result = await resend.emails.send({
        from: 'StrengthQuest <hello@strengthquest.xyz>',
        replyTo: 'support@strengthquest.xyz',
        to: email,
        subject: 'Sign in to StrengthQuest',
        headers: {
          'List-Unsubscribe': '<mailto:unsubscribe@strengthquest.xyz>',
          'X-Entity-Ref-ID': new Date().getTime().toString(),
        },
        tags: [
          {
            name: 'category',
            value: 'authentication'
          }
        ],
        html: `
          <h1>Welcome to StrengthQuest!</h1>
          <p>Click the link below to sign in to your account. This link will expire in 15 minutes.</p>
          <a href="${magicLink}" style="display: inline-block; background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0;">Sign in to StrengthQuest</a>
          <p style="color: #666; font-size: 14px;">If the button doesn't work, copy and paste this link into your browser:</p>
          <p style="color: #666; font-size: 14px;">${magicLink}</p>
          <p style="color: #666; font-size: 12px; margin-top: 24px;">
            This email was sent from StrengthQuest. If you did not request this email, you can safely ignore it.
            <br>
            To unsubscribe from authentication emails, reply with "unsubscribe".
          </p>
        `
      })
      console.log('✓ Email sent successfully')
    } catch (error) {
      console.error('Failed to send email:', error)
      throw new Error('Failed to send email')
    }

    return true
  } catch (error) {
    console.error('Error in createMagicLink:', error)
    throw error
  }
}

export async function createSession(userId: string) {
  const token = await new SignJWT({ userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET)

  cookies().set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
  })

  return token
}

export async function getSession() {
  const cookieStore = cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  
  if (!token) return null
  
  return await verifyJWT(token)
}

export async function verifyJWT(token: string) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload.userId as string
  } catch {
    return null
  }
}

export async function getCurrentUser() {
  const userId = await getSession()
  if (!userId) return null

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      weightUnit: true,
      barbellWeight: true,
      createdAt: true
    }
  })

  return user
}

export async function logout() {
  cookies().delete(COOKIE_NAME)
}

export async function createToken(payload: any) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setJti(nanoid())
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(JWT_SECRET)
}

export async function setUserCookie(token: string) {
  cookies().set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 // 24 hours
  })
}

export async function removeUserCookie() {
  cookies().delete(COOKIE_NAME)
} 