import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { identifier } = await req.json(); // identifier is phone or email

    if (!identifier) {
      return NextResponse.json({ error: 'Phone number or email is required' }, { status: 400 });
    }

    // Generate a mock OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    // Check if user exists by email or phone
    const isEmail = identifier.includes('@');
    
    let user = await prisma.user.findFirst({
      where: isEmail ? { email: identifier } : { phone: identifier }
    });

    if (user) {
      // Update existing user
      await prisma.user.update({
        where: { id: user.id },
        data: { otp, otpExpiry }
      });
    } else {
      // Create new user
      user = await prisma.user.create({
        data: isEmail ? { email: identifier, otp, otpExpiry } : { phone: identifier, otp, otpExpiry }
      });
    }

    // Demo Mode: We return the OTP in the response to display in a toast
    return NextResponse.json({ message: 'OTP generated', otp }, { status: 200 });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
