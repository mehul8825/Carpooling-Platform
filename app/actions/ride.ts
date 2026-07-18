"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function publishRideAction(data: {
  driverId: string;
  vehicleId: string;
  pickupLocation: string;
  pickupLat: number;
  pickupLng: number;
  dropLocation: string;
  dropLat: number;
  dropLng: number;
  travelDateTime: Date;
  availableSeats: number;
  farePerSeat: number;
}) {
  try {
    // Demo/Hackathon Fix: Auto-fetch or create a valid user and vehicle
    let user = await prisma.user.findFirst();
    if (!user) {
      user = await prisma.user.create({
        data: {
          name: "Test Driver",
          email: "driver@example.com",
          role: "EMPLOYEE",
        },
      });
    }

    let vehicle = await prisma.vehicle.findFirst({
      where: { driverId: user.id },
    });
    
    if (!vehicle) {
      vehicle = await prisma.vehicle.create({
        data: {
          driverId: user.id,
          vehicleModel: "Toyota Prius",
          registrationNo: "XYZ 1234",
          seatingCapacity: 4,
        },
      });
    }

    const ride = await prisma.ride.create({
      data: {
        driverId: user.id,
        vehicleId: vehicle.id,
        pickupLocation: data.pickupLocation,
        pickupLat: data.pickupLat,
        pickupLng: data.pickupLng,
        dropLocation: data.dropLocation,
        dropLat: data.dropLat,
        dropLng: data.dropLng,
        travelDateTime: data.travelDateTime,
        availableSeats: data.availableSeats,
        farePerSeat: data.farePerSeat,
        status: "PUBLISHED",
      },
    });
    
    revalidatePath("/rides");
    return { success: true, ride };
  } catch (error: any) {
    console.error("Failed to publish ride:", error);
    return { success: false, error: error.message };
  }
}

export async function requestBookingAction(data: {
  rideId: string;
  passengerId: string;
  seatsBooked: number;
  totalFare: number;
}) {
  try {
    const booking = await prisma.rideBooking.create({
      data: {
        rideId: data.rideId,
        passengerId: data.passengerId,
        seatsBooked: data.seatsBooked,
        totalFare: data.totalFare,
        status: "REQUESTED",
      },
    });

    return { success: true, booking };
  } catch (error: any) {
    console.error("Failed to request booking:", error);
    return { success: false, error: error.message };
  }
}

export async function approveBookingAction(bookingId: string, driverId: string) {
  try {
    // 1. Fetch the booking
    const booking = await prisma.rideBooking.findUnique({
      where: { id: bookingId },
      include: { ride: true },
    });

    if (!booking) throw new Error("Booking not found");
    if (booking.ride.driverId !== driverId) throw new Error("Unauthorized");
    if (booking.status !== "REQUESTED") throw new Error("Booking is not in REQUESTED state");
    if (booking.ride.availableSeats < booking.seatsBooked) {
      throw new Error("Not enough seats available");
    }

    // 2. Update booking and ride in a transaction
    await prisma.$transaction([
      prisma.rideBooking.update({
        where: { id: bookingId },
        data: { status: "APPROVED" },
      }),
      prisma.ride.update({
        where: { id: booking.rideId },
        data: { availableSeats: { decrement: booking.seatsBooked } },
      }),
    ]);

    revalidatePath("/rides");
    return { success: true };
  } catch (error: any) {
    console.error("Failed to approve booking:", error);
    return { success: false, error: error.message };
  }
}
