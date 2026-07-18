"use server";

import { prisma } from "@/lib/db";
import { getCurrentUserAction } from "./auth";
import { revalidatePath } from "next/cache";

export async function getUnreadNotificationsAction() {
  try {
    const user = await getCurrentUserAction();
    if (!user) return { success: false, data: [] };

    const notifications = await prisma.notification.findMany({
      where: { userId: user.id, isRead: false },
      orderBy: { createdAt: "desc" },
      take: 10
    });

    return { success: true, data: notifications };
  } catch (error) {
    console.error(error);
    return { success: false, data: [] };
  }
}

export async function markNotificationsAsReadAction(notificationIds: string[]) {
  try {
    const user = await getCurrentUserAction();
    if (!user) return { success: false };

    await prisma.notification.updateMany({
      where: { 
        id: { in: notificationIds },
        userId: user.id 
      },
      data: { isRead: true }
    });

    // We don't want to revalidate the whole app layout, just return success
    return { success: true };
  } catch (error) {
    console.error(error);
    return { success: false };
  }
}

export async function createNotification(userId: string, title: string, message: string) {
  try {
    await prisma.notification.create({
      data: {
        userId,
        title,
        message
      }
    });
  } catch (error) {
    console.error("Failed to create notification:", error);
  }
}
