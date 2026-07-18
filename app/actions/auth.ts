"use server";

import { prisma } from "@/lib/db";
import { sendOtpEmail } from "@/lib/email";
import { createSession, deleteSession, verifySession } from "@/lib/auth";

export async function sendOtpAction(email: string, name?: string, isRegister?: boolean) {
  try {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (isRegister) {
      if (existingUser) {
        return { success: false, error: "User already exists. Please sign in." };
      }
      
      // Create user with OTP
      await prisma.user.create({
        data: {
          email,
          name: name || "User",
          otp,
          otpExpiry: expiry,
          role: "EMPLOYEE",
        },
      });
    } else {
      if (!existingUser) {
        return { success: false, error: "User not found. Please sign up first." };
      }

      // Update existing user with OTP
      await prisma.user.update({
        where: { email },
        data: {
          otp,
          otpExpiry: expiry,
        },
      });
    }

    // Send email
    await sendOtpEmail(email, otp);
    return { success: true };
  } catch (error: any) {
    console.error("Failed to send OTP:", error);
    return { success: false, error: error.message || "Failed to send OTP." };
  }
}

export async function verifyOtpAction(email: string, otp: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return { success: false, error: "User not found." };
    }

    if (!user.otp || !user.otpExpiry) {
      return { success: false, error: "No active OTP request found." };
    }

    const now = new Date();
    if (user.otp !== otp || user.otpExpiry < now) {
      return { success: false, error: "Invalid or expired OTP." };
    }

    // Clear OTP and authenticate
    await prisma.user.update({
      where: { email },
      data: {
        otp: null,
        otpExpiry: null,
      },
    });

    await createSession(user.id);
    return { success: true };
  } catch (error: any) {
    console.error("Failed to verify OTP:", error);
    return { success: false, error: error.message || "Verification failed." };
  }
}

export async function logoutAction() {
  await deleteSession();
}

export async function getCurrentUserAction() {
  try {
    const userId = await verifySession();
    if (!userId) return null;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });

    return user;
  } catch (error) {
    console.error("Failed to get current user:", error);
    return null;
  }
}
