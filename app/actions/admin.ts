"use server";

import { prisma } from "@/lib/db";
import { getCurrentUserAction } from "./auth";
import { revalidatePath } from "next/cache";

export async function approveDriverAction(userId: string) {
  try {
    const admin = await getCurrentUserAction();
    if (!admin || admin.role !== "ADMIN") return { success: false, error: "Unauthorized" };

    // Update status to APPROVED
    await prisma.driverProfile.update({
      where: { userId: userId },
      data: { status: "APPROVED" }
    });

    // Provision dummy vehicle for testing purposes if they don't have one
    const existingVehicle = await prisma.vehicle.findFirst({ where: { driverId: userId }});
    if (!existingVehicle) {
      await prisma.vehicle.create({
        data: {
          driverId: userId,
          vehicleModel: "Corporate Sedan (Demo)",
          registrationNo: "AB 12 CD " + Math.floor(1000 + Math.random() * 9000),
          seatingCapacity: 4
        }
      });
    }

    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Failed to approve driver" };
  }
}

export async function rejectDriverAction(userId: string) {
  try {
    const admin = await getCurrentUserAction();
    if (!admin || admin.role !== "ADMIN") return { success: false, error: "Unauthorized" };

    // Update status to REJECTED
    await prisma.driverProfile.update({
      where: { userId: userId },
      data: { status: "REJECTED" }
    });

    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Failed to reject driver" };
  }
}
