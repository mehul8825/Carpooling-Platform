"use server";

import { prisma } from "@/lib/db";
import { getCurrentUserAction } from "./auth";
import { revalidatePath } from "next/cache";

// ─────────────────────────────────────────────
// OFFER RIDE: Driver publishes a ride
// ─────────────────────────────────────────────

export async function publishRideAction(data: {
  pickupLocation: string;
  pickupLat: number;
  pickupLng: number;
  dropLocation: string;
  dropLat: number;
  dropLng: number;
  travelDateTime: string; // ISO string from client
  availableSeats: number;
  farePerSeat: number;
}) {
  try {
    const user = await getCurrentUserAction();
    const userId = user?.id;
    if (!userId) return { success: false, error: "Not authenticated" };

    // Ensure user has a vehicle (auto-create for hackathon demo)
    let vehicle = await prisma.vehicle.findFirst({
      where: { driverId: userId },
    });

    if (!vehicle) {
      vehicle = await prisma.vehicle.create({
        data: {
          driverId: userId,
          vehicleModel: "My Car",
          registrationNo: "DEMO-0000",
          seatingCapacity: 4,
        },
      });
    }

    if (!user) throw new Error("User not found");

    const driverProfile = await prisma.driverProfile.findUnique({ where: { userId } });
    if (!driverProfile || driverProfile.status !== "APPROVED") {
      return { success: false, error: "Your driver profile must be approved by an admin before you can offer a ride." };
    }

    const ride = await prisma.ride.create({
      data: {
        driverId: userId,
        vehicleId: vehicle.id,
        pickupLocation: data.pickupLocation,
        pickupLat: data.pickupLat,
        pickupLng: data.pickupLng,
        dropLocation: data.dropLocation,
        dropLat: data.dropLat,
        dropLng: data.dropLng,
        travelDateTime: new Date(data.travelDateTime),
        availableSeats: data.availableSeats,
        farePerSeat: data.farePerSeat,
        status: "PUBLISHED",
      },
    });

    revalidatePath("/");
    revalidatePath("/find-ride");
    
    // Notify all other employees about the new ride
    const otherUsers = await prisma.user.findMany({
      where: { id: { not: user.id } },
      select: { id: true }
    });

    if (otherUsers.length > 0) {
      const notifications = otherUsers.map(u => ({
        userId: u.id,
        title: "New Ride Available",
        message: `${user.name} just published a ride going to ${data.dropLocation}.`,
      }));
      await prisma.notification.createMany({ data: notifications });
    }

    const broadcastRide = {
      ...ride,
      driver: { id: user.id, name: user.name, email: user.email },
      vehicle: { vehicleModel: vehicle.vehicleModel, registrationNo: vehicle.registrationNo, seatingCapacity: vehicle.seatingCapacity }
    };

    return { success: true, ride: broadcastRide };
  } catch (error: any) {
    console.error("Failed to publish ride:", error);
    return { success: false, error: error.message };
  }
}

// ─────────────────────────────────────────────
// FIND RIDE: Passenger searches for matching rides
// Uses proximity: checks if ride pickup/drop are within
// a radius (km) of passenger's pickup/drop
// ─────────────────────────────────────────────

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export async function searchRidesAction(data: {
  pickupLat: number;
  pickupLng: number;
  dropLat: number;
  dropLng: number;
  radiusKm?: number;
}) {
  try {
    const user = await getCurrentUserAction();
    const userId = user?.id;
    const radiusKm = data.radiusKm || 5; // default 5 km radius

    // Fetch all published rides with available seats
    const allRides = await prisma.ride.findMany({
      where: {
        status: "PUBLISHED",
        availableSeats: { gt: 0 },
      },
      include: {
        driver: {
          select: { id: true, name: true, email: true },
        },
        vehicle: {
          select: { vehicleModel: true, registrationNo: true, seatingCapacity: true },
        },
        _count: {
          select: { bookings: { where: { status: "APPROVED" } } },
        },
      },
      orderBy: { travelDateTime: "asc" },
    });
    // Filter by proximity using Haversine formula
    const matched = allRides
      .map((ride) => {
        const pickupDist = haversineKm(data.pickupLat, data.pickupLng, ride.pickupLat, ride.pickupLng);
        const dropDist = haversineKm(data.dropLat, data.dropLng, ride.dropLat, ride.dropLng);
        return { ...ride, pickupDist, dropDist };
      })
      .filter((ride) => {
        // Exclude user's own rides
        if (userId && ride.driverId === userId) return false;
        return ride.pickupDist <= radiusKm && ride.dropDist <= radiusKm;
      })
      .sort((a, b) => a.pickupDist + a.dropDist - (b.pickupDist + b.dropDist));

    return { success: true, rides: matched };
  } catch (error: any) {
    console.error("Failed to search rides:", error);
    return { success: false, error: error.message, rides: [] };
  }
}

// ─────────────────────────────────────────────
// BOOKING: Passenger requests a seat
// ─────────────────────────────────────────────

export async function requestBookingAction(data: {
  rideId: string;
  seatsBooked: number;
}) {
  try {
    const user = await getCurrentUserAction();
    const userId = user?.id;
    if (!userId) return { success: false, error: "Not authenticated" };

    const ride = await prisma.ride.findUnique({
      where: { id: data.rideId },
    });

    if (!ride) return { success: false, error: "Ride not found" };
    if (ride.driverId === userId) return { success: false, error: "Cannot book your own ride" };
    if (ride.availableSeats < data.seatsBooked) return { success: false, error: "Not enough seats" };

    // Check for existing pending/approved booking
    const existingBooking = await prisma.rideBooking.findFirst({
      where: {
        rideId: data.rideId,
        passengerId: userId,
        status: { in: ["REQUESTED", "APPROVED"] },
      }
    });

    if (existingBooking) return { success: false, error: "You already have a booking on this ride" };

    const booking = await prisma.rideBooking.create({
      data: {
        rideId: data.rideId,
        passengerId: userId,
        seatsBooked: data.seatsBooked,
        totalFare: ride.farePerSeat * data.seatsBooked,
        status: "REQUESTED",
      },
      include: {
        passenger: { select: { id: true, name: true, email: true } }
      }
    });

    // Notify the driver
    await prisma.notification.create({
      data: {
        userId: ride.driverId,
        title: "New Seat Request",
        message: `${user?.name || "Someone"} requested ${data.seatsBooked} seat(s) on your ride to ${ride.dropLocation}.`
      }
    });

    revalidatePath("/offer-ride");
    return { success: true, booking, driverId: ride.driverId };
  } catch (error: any) {
    console.error("Failed to request booking:", error);
    return { success: false, error: error.message };
  }
}

// ─────────────────────────────────────────────
// DRIVER: Approve or reject a booking request
// ─────────────────────────────────────────────

export async function approveBookingAction(bookingId: string) {
  try {
    const user = await getCurrentUserAction();
    const userId = user?.id;
    if (!userId) return { success: false, error: "Not authenticated" };

    const booking = await prisma.rideBooking.findUnique({
      where: { id: bookingId },
      include: { ride: true },
    });

    if (!booking) return { success: false, error: "Booking not found" };
    if (booking.ride.driverId !== userId) return { success: false, error: "Unauthorized" };
    if (booking.status !== "REQUESTED") return { success: false, error: "Booking is not in REQUESTED state" };
    if (booking.ride.availableSeats < booking.seatsBooked) {
      return { success: false, error: "Not enough seats available" };
    }

    await prisma.$transaction([
      prisma.rideBooking.update({
        where: { id: bookingId },
        data: { status: "APPROVED" },
      }),
      prisma.ride.update({
        where: { id: booking.rideId },
        data: { 
          availableSeats: { decrement: booking.seatsBooked },
          status: "ONGOING"
        },
      }),
    ]);
    
    // Automatically reject any other pending requests from this same passenger for this ride
    await prisma.rideBooking.updateMany({
      where: {
        rideId: booking.rideId,
        passengerId: booking.passengerId,
        status: "REQUESTED",
        id: { not: bookingId }
      },
      data: { status: "REJECTED" }
    });

    // Notify passenger
    await prisma.notification.create({
      data: {
        userId: booking.passengerId,
        title: "Booking Accepted",
        message: `${user?.name || "Driver"} accepted your seat request for the ride to ${booking.ride.dropLocation}.`
      }
    });

    revalidatePath("/offer-ride");
    return { success: true };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Failed to book ride" };
  }
}

export async function rejectBookingAction(bookingId: string) {
  try {
    const user = await getCurrentUserAction();
    const userId = user?.id;
    if (!userId) return { success: false, error: "Not authenticated" };

    const booking = await prisma.rideBooking.findUnique({
      where: { id: bookingId },
      include: { ride: true },
    });

    if (!booking) return { success: false, error: "Booking not found" };
    if (booking.ride.driverId !== userId) return { success: false, error: "Unauthorized" };
    if (booking.status !== "REQUESTED") return { success: false, error: "Booking is not in REQUESTED state" };

    await prisma.rideBooking.update({
      where: { id: bookingId },
      data: { status: "REJECTED" },
    });

    // Update booking status for THIS and ALL other duplicate requests from the same user for this ride
    await prisma.rideBooking.updateMany({
      where: { 
        rideId: booking.rideId,
        passengerId: booking.passengerId,
        status: "REQUESTED"
      },
      data: { status: "REJECTED" }
    });

    // Notify passenger
    await prisma.notification.create({
      data: {
        userId: booking.passengerId,
        title: "Booking Rejected",
        message: `${user?.name || "Driver"} rejected your seat request for the ride to ${booking.ride.dropLocation}.`
      }
    });

    revalidatePath("/offer-ride");
    return { success: true };
  } catch (error: any) {
    console.error("Failed to reject booking:", error);
    return { success: false, error: error.message };
  }
}

// ─────────────────────────────────────────────
// DRIVER DASHBOARD: Get rides I've published + incoming requests
// ─────────────────────────────────────────────

export async function getMyRidesAction() {
  try {
    const user = await getCurrentUserAction();
    const userId = user?.id;
    if (!userId) return { success: false, rides: [] };

    const rides = await prisma.ride.findMany({
      where: { driverId: userId },
      include: {
        vehicle: true,
        bookings: {
          include: {
            passenger: {
              select: { id: true, name: true, email: true },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return { success: true, rides };
  } catch (error: any) {
    console.error("Failed to get my rides:", error);
    return { success: false, rides: [] };
  }
}

// ─────────────────────────────────────────────
// PASSENGER DASHBOARD: Get bookings I've requested
// ─────────────────────────────────────────────

export async function getMyBookingsAction() {
  try {
    const user = await getCurrentUserAction();
    const userId = user?.id;
    if (!userId) return { success: false, bookings: [] };

    const bookings = await prisma.rideBooking.findMany({
      where: { passengerId: userId },
      include: {
        ride: {
          include: {
            driver: { select: { id: true, name: true, phone: true } },
            vehicle: true,
          }
        }
      },
      orderBy: { createdAt: "desc" },
    });

    return { success: true, bookings };
  } catch (error: any) {
    console.error("Failed to get my bookings:", error);
    return { success: false, bookings: [] };
  }
}
