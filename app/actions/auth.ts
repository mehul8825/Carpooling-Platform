"use server";

import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { cookies } from "next/headers";

const registerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().min(1, "Phone number is required"),
  email: z.string().email("Invalid email"),
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export async function registerUserAction(data: z.infer<typeof registerSchema>) {
  try {
    const parsed = registerSchema.parse(data);

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: parsed.email },
          { username: parsed.username },
          { phone: parsed.phone },
        ],
      },
    });

    if (existingUser) {
      if (existingUser.email === parsed.email) return { success: false, error: "Email already in use" };
      if (existingUser.username === parsed.username) return { success: false, error: "Username already taken" };
      if (existingUser.phone === parsed.phone) return { success: false, error: "Phone number already in use" };
    }

    const hashedPassword = await bcrypt.hash(parsed.password, 10);
    const role = parsed.username.toLowerCase().includes("admin") ? "ADMIN" : "EMPLOYEE";

    const newUser = await prisma.user.create({
      data: {
        name: parsed.name,
        email: parsed.email,
        phone: parsed.phone,
        username: parsed.username,
        password: hashedPassword,
        role: role,
      },
    });

    (await cookies()).set("session_user_id", newUser.id, { httpOnly: true, path: "/" });

    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      // @ts-expect-error - ZodError generic type issue
      return { success: false, error: error.errors[0].message };
    }
    return { success: false, error: "An unexpected error occurred" };
  }
}

export async function loginUserAction(username: string, password: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user || !user.password) {
      return { success: false, error: "Invalid username or password" };
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return { success: false, error: "Invalid username or password" };
    }

    if (user.forcePasswordChange) {
      return {
        success: true,
        forcePasswordChange: true,
        user: { id: user.id, name: user.name, username: user.username, role: user.role }
      };
    }

    (await cookies()).set("session_user_id", user.id, { httpOnly: true, path: "/" });

    return { 
      success: true, 
      user: { id: user.id, name: user.name, username: user.username, role: user.role },
      role: user.role 
    };
  } catch (error) {
    return { success: false, error: "An unexpected error occurred" };
  }
}

export async function changePasswordAction(userId: string, newPassword: string) {
  try {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
        forcePasswordChange: false
      }
    });

    (await cookies()).set("session_user_id", userId, { httpOnly: true, path: "/" });
    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to update password" };
  }
}

export async function getCurrentUserAction() {
  const userId = (await cookies()).get("session_user_id")?.value;
  if (!userId) return null;

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { driverProfile: true, vehicles: true }
    });
    return user;
  } catch (error) {
    return null;
  }
}

export async function logoutAction() {
  (await cookies()).delete("session_user_id");
  return { success: true };
}

export async function directAdminLoginAction() {
  try {
    const adminUser = await prisma.user.findFirst({
      where: { role: "ADMIN" },
    });

    if (!adminUser) {
      return { success: false, error: "No admin user found. Please register an account with 'admin' in the username first." };
    }

    (await cookies()).set("session_user_id", adminUser.id, { httpOnly: true, path: "/" });
    return { success: true };
  } catch (error) {
    return { success: false, error: "An unexpected error occurred" };
  }
}

import { sendPasswordResetOTPEmail } from "@/lib/mailer";

export async function requestPasswordResetAction(email: string) {
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Return success even if user doesn't exist to prevent email enumeration
      return { success: true }; 
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

    await prisma.user.update({
      where: { id: user.id },
      data: { otp, otpExpiry }
    });

    await sendPasswordResetOTPEmail(email, otp);

    return { success: true };
  } catch (error) {
    console.error("Error requesting password reset:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

export async function resetPasswordAction(email: string, otp: string, newPassword: string) {
  try {
    if (newPassword.length < 6) {
      return { success: false, error: "Password must be at least 6 characters" };
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || user.otp !== otp) {
      return { success: false, error: "Invalid OTP" };
    }

    if (!user.otpExpiry || user.otpExpiry < new Date()) {
      return { success: false, error: "OTP has expired" };
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        otp: null,
        otpExpiry: null
      }
    });

    return { success: true };
  } catch (error) {
    console.error("Error resetting password:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}
