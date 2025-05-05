import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import prisma from '@/lib/prisma'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import { sendVerificationEmail } from '@/utils/emailService'
import { ok } from 'assert'

// Password validation function
const isValidPassword = (password: string): boolean => {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  return (
    password.length >= minLength &&
    hasUpperCase &&
    hasLowerCase &&
    hasNumbers &&
    hasSpecialChar
  );
};

export async function POST(req: Request) {
  try {
    const { email, password, name, phone } = await req.json()

    // Validate required fields
    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate password
    if (!isValidPassword(password)) {
      return NextResponse.json(
        { 
          error: 'Password must be at least 8 characters long and contain uppercase, lowercase, numbers, and special characters',
          status: 400 
        }
      )
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: {  email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already in use' },
        { status: 400 }
      )
    }
    
    const existingName = await prisma.user.findFirst({
      where: { 
        name: {
          equals: name.toLowerCase(),
        }
      }
    })

  

    if (existingName) {
      return NextResponse.json(
        { error: 'Username already taken' },
        { status: 400 }
      )
    }
    

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex')

    // Create user with verification token
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        phone: phone || null,
        emailVerified: false,
        verificationToken: verificationToken 
      }
    })

    // Send verification email
    await sendVerificationEmail(email, verificationToken)

    return NextResponse.json({  
      message: 'Registration successful. Please check your email to verify your account.',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,

        
      }
    })
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Failed to register user' },
      { status: 500 },
    )
  }
}

