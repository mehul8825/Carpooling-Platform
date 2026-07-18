"use server";

import { prisma } from "@/lib/db";
import { getCurrentUserAction } from "./auth";
import { revalidatePath } from "next/cache";

export async function publishRideAction(data: {
  from: string;
  to: string;
  date: string;
  seats: number;
  fare: number;
  vehicleId: string;
}) {
  try {
    const user = await getCurrentUserAction();
    if (!user) return { success: false, error: "Not authenticated" };

    await prisma.ride.create({
      data: {
        driverId: user.id,
        vehicleId: data.vehicleId,
        pickupLocation: data.from,
        pickupLat: 0, // Mock
        pickupLng: 0,
        dropLocation: data.to,
        dropLat: 0,
        dropLng: 0,
        travelDateTime: new Date(data.date),
        availableSeats: data.seats,
        farePerSeat: data.fare,
        status: "PUBLISHED"
      }
    });

    revalidatePath("/employee/offer-ride");
    revalidatePath("/employee");
    return { success: true };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Failed to publish ride" };
  }
}

export async function searchRidesAction(data: {
  from: string;
  to: string;
  seats: number;
}) {
  try {
    // In a real app we'd do geospatial search or text search.
    // For now we just return all published rides that have enough seats.
    const rides = await prisma.ride.findMany({
      where: {
        status: "PUBLISHED",
        availableSeats: { gte: data.seats },
      },
      include: {
        driver: { select: { name: true, username: true } },
        vehicle: true
      },
      orderBy: { travelDateTime: "asc" }
    });

    return { success: true, rides };
  } catch (error) {
    return { success: false, error: "Failed to search rides" };
  }
}

export async function requestBookingAction(rideId: string, seats: number = 1) {
  try {
    const user = await getCurrentUserAction();
    if (!user) return { success: false, error: "Not authenticated" };

    const ride = await prisma.ride.findUnique({ where: { id: rideId } });
    if (!ride) return { success: false, error: "Ride not found" };

    await prisma.rideBooking.create({
      data: {
        rideId,
        passengerId: user.id,
        seatsBooked: seats,
        totalFare: ride.farePerSeat * seats,
        status: "REQUESTED"
      }
    });

    revalidatePath("/employee");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Failed to book ride" };
  }
}
