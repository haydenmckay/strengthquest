import { cookies } from 'next/headers'
import { jwtVerify, SignJWT } from 'jose'
import { prisma } from './prisma'
import bcrypt from 'bcryptjs'
import { Resend } from 'resend'
import { v4 as uuidv4 } from 'uuid'
import { nanoid } from 'nanoid'

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'default-secret-key')
const COOKIE_NAME = process.env.COOKIE_NAME || 'strengthquest_session'
const resend = new Resend(process.env.RESEND_API_KEY)

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10)
}

export async function comparePasswords(password: string, hash: string) {
  return bcrypt.compare(password, hash)
}

export async function createMagicLink(email: string) {
  try {
    // Create or get user
    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        email,
        passwordHash: uuidv4(), // Generate a random string since we don't use passwords
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
      }
    })

    // Create token
    const token = await new SignJWT({ userId: user.id })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('15m') // Magic links expire in 15 minutes
      .sign(JWT_SECRET)

    // Create magic link
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const magicLink = `${baseUrl}/auth/verify?token=${encodeURIComponent(token)}`

    console.log('Sending magic link email:', {
      to: email,
      magicLink,
      baseUrl,
      environment: process.env.NODE_ENV
    })

    // Send email
    const result = await resend.emails.send({
      from: 'StrengthQuest <no-reply@strengthquest.xyz>',
      to: email,
      subject: 'Sign in to StrengthQuest',
      html: `
        <h1>Welcome to StrengthQuest!</h1>
        <p>Click the link below to sign in to your account. This link will expire in 15 minutes.</p>
        <a href="${magicLink}" style="display: inline-block; background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0;">Sign in to StrengthQuest</a>
        <p style="color: #666; font-size: 14px;">If the button doesn't work, copy and paste this link into your browser:</p>
        <p style="color: #666; font-size: 14px;">${magicLink}</p>
      `
    })

    if (!result?.id) {
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