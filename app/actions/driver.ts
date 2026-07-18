"use server";

import { prisma } from "@/lib/db";
import { getCurrentUserAction } from "./auth";
import { revalidatePath } from "next/cache";

export async function submitDriverVerificationAction(data: {
  driverPhoto?: string;
  aadharCard?: string;
  drivingLicence?: string;
  vehiclePuc?: string;
  vehicleFront?: string;
  vehicleRear?: string;
}) {
  try {
    const user = await getCurrentUserAction();
    if (!user) return { success: false, error: "Not authenticated" };

    // Upsert a pending DriverProfile
    await prisma.driverProfile.upsert({
      where: { userId: user.id },
      update: {
        status: "PENDING",
        rejectionReason: null,
        driverPhoto: data.driverPhoto,
        aadharCard: data.aadharCard,
        drivingLicence: data.drivingLicence,
        vehiclePuc: data.vehiclePuc,
        vehicleFront: data.vehicleFront,
        vehicleRear: data.vehicleRear,
      },
      create: {
        userId: user.id,
        status: "PENDING",
        driverPhoto: data.driverPhoto,
        aadharCard: data.aadharCard,
        drivingLicence: data.drivingLicence,
        vehiclePuc: data.vehiclePuc,
        vehicleFront: data.vehicleFront,
        vehicleRear: data.vehicleRear,
      }
    });

    revalidatePath("/offer-ride");
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

    revalidatePath("/offer-ride");
    return { success: true };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Failed to approve driver" };
  }
}
