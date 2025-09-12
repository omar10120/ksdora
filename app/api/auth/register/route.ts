import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import prisma from '@/lib/prisma'
import crypto from 'crypto'
import { sendVerificationEmail } from '@/utils/emailService'
import { ok } from 'assert'
import { Varela } from 'next/font/google'
import { ApiResponseBuilder, SuccessMessages, ErrorMessages, StatusCodes } from '@/lib/apiResponse'
import { validateRequest } from '@/lib/validation'
import { asyncHandler, ApiError } from '@/lib/errorHandler'

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

export const POST = asyncHandler(async (req: Request) => {
  try {
    var { email, password , name, phone } = await req.json()

    // Validate required fields
    // if (!email || !password || !name) {
    if(!password){
       password = "Aa@123456"
     
    }
    if (!email || !password || !name) {
      return ApiResponseBuilder.error('Missing required fields', StatusCodes.BAD_REQUEST)
    }

    // Validate password
    if (!isValidPassword(password)) {
      return ApiResponseBuilder.error('Password must be at least 8 characters long and contain uppercase, lowercase, numbers, and special characters', StatusCodes.BAD_REQUEST)
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: {  email }
    })

    if (existingUser) {
      return ApiResponseBuilder.error('Email already in use', StatusCodes.BAD_REQUEST)
    }
    
    const existingName = await prisma.user.findFirst({
      where: { 
        name: {
          equals: name.toLowerCase(),
        }
      }
    })

  

    if (existingName) {
      return ApiResponseBuilder.error('Username already taken', StatusCodes.BAD_REQUEST)
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

    return ApiResponseBuilder.success({  
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
    return ApiResponseBuilder.error('Failed to register user', StatusCodes.INTERNAL_SERVER_ERROR)
  }
  }
)

