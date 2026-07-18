"use server";

import { prisma } from "@/lib/db";
import { getCurrentUserAction } from "./auth";
import { revalidatePath } from "next/cache";

export async function getMyVehiclesAction() {
  try {
    const user = await getCurrentUserAction();
    if (!user) return { success: false, data: [] };

    const vehicles = await prisma.vehicle.findMany({
      where: { driverId: user.id },
      orderBy: { createdAt: "desc" }
    });

    return { success: true, data: vehicles };
  } catch (error) {
    console.error("Failed to fetch vehicles:", error);
    return { success: false, data: [] };
  }
}

export async function addMyVehicleAction(data: { vehicleModel: string; registrationNo: string; seatingCapacity: number }) {
  try {
    const user = await getCurrentUserAction();
    if (!user) return { success: false, error: "Not authenticated" };

    const newVehicle = await prisma.vehicle.create({
      data: {
        driverId: user.id,
        vehicleModel: data.vehicleModel,
        registrationNo: data.registrationNo,
        seatingCapacity: data.seatingCapacity
      }
    });

    revalidatePath("/employee/vehicles");
    revalidatePath("/employee/offer-ride");
    return { success: true, data: newVehicle };
  } catch (error) {
    console.error("Failed to add vehicle:", error);
    return { success: false, error: "Failed to add vehicle" };
  }
}

export async function updateMyVehicleAction(vehicleId: string, data: { vehicleModel: string; registrationNo: string; seatingCapacity: number }) {
  try {
    const user = await getCurrentUserAction();
    if (!user) return { success: false, error: "Not authenticated" };

    // Verify ownership
    const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
    if (!vehicle || vehicle.driverId !== user.id) {
      return { success: false, error: "Unauthorized" };
    }

    await prisma.vehicle.update({
      where: { id: vehicleId },
      data: {
        vehicleModel: data.vehicleModel,
        registrationNo: data.registrationNo,
        seatingCapacity: data.seatingCapacity
      }
    });

    revalidatePath("/employee/vehicles");
    revalidatePath("/employee/offer-ride");
    return { success: true };
  } catch (error) {
    console.error("Failed to update vehicle:", error);
    return { success: false, error: "Failed to update vehicle" };
  }
}

export async function deleteMyVehicleAction(vehicleId: string) {
  try {
    const user = await getCurrentUserAction();
    if (!user) return { success: false, error: "Not authenticated" };

    // Verify ownership
    const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
    if (!vehicle || vehicle.driverId !== user.id) {
      return { success: false, error: "Unauthorized" };
    }

    // Optional: Check if vehicle is attached to active rides
    const activeRides = await prisma.ride.count({
      where: { 
        vehicleId: vehicleId,
        status: { in: ["PUBLISHED", "ONGOING"] }
      }
    });

    if (activeRides > 0) {
      return { success: false, error: "Cannot delete vehicle linked to active rides" };
    }

    await prisma.vehicle.delete({
      where: { id: vehicleId }
    });

    revalidatePath("/employee/vehicles");
    revalidatePath("/employee/offer-ride");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete vehicle:", error);
    return { success: false, error: "Failed to delete vehicle" };
  }
}
