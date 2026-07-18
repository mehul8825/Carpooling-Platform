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
