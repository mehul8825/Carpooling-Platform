"use server";

import { prisma } from "@/lib/db";
import { getCurrentUserAction } from "./auth";
import { revalidatePath } from "next/cache";

export async function submitDriverVerificationAction() {
  try {
    const user = await getCurrentUserAction();
    if (!user) return { success: false, error: "Not authenticated" };

    // Upsert a pending DriverProfile
    await prisma.driverProfile.upsert({
      where: { userId: user.id },
      update: {
        status: "PENDING",
        rejectionReason: null,
      },
      create: {
        userId: user.id,
        status: "PENDING",
      }
    });

    revalidatePath("/employee/offer-ride");
    return { success: true };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Failed to submit verification" };
  }
}

export async function simulateAdminApprovalAction() {
  try {
    const user = await getCurrentUserAction();
    if (!user) return { success: false, error: "Not authenticated" };

    // Update status to APPROVED
    await prisma.driverProfile.update({
      where: { userId: user.id },
      data: { status: "APPROVED" }
    });

    // Create a dummy vehicle for them automatically so they can immediately publish rides
    await prisma.vehicle.create({
      data: {
        driverId: user.id,
        vehicleModel: "Honda Civic (Demo)",
        registrationNo: "AB 12 CD 3456",
        seatingCapacity: 4
      }
    });

    revalidatePath("/employee/offer-ride");
    return { success: true };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Failed to approve driver" };
  }
}
