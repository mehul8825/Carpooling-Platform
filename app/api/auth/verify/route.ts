import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { identifier, otp } = await req.json();

    if (!identifier || !otp) {
      return NextResponse.json({ error: 'Identifier and OTP are required' }, { status: 400 });
    }

    const isEmail = identifier.includes('@');
    
    const user = await prisma.user.findFirst({
      where: isEmail ? { email: identifier } : { phone: identifier }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.otp !== otp || !user.otpExpiry || user.otpExpiry < new Date()) {
      return NextResponse.json({ error: 'Invalid or expired OTP' }, { status: 401 });
    }

    // Clear OTP after successful verification
    await prisma.user.update({
      where: { id: user.id },
      data: { otp: null, otpExpiry: null }
    });

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '7d' }
    );

    const isNewUser = !user.name; // If name is missing, they need onboarding

    const response = NextResponse.json({ 
      message: 'Verified successfully',
      isNewUser,
      role: user.role
    }, { status: 200 });

    // Set HTTP Only cookie
    response.cookies.set({
      name: 'auth_token',
      value: token,
      httpOnly: true,
      path: '/',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    });

    return response;
  } catch (error) {
    console.error('Verify error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
