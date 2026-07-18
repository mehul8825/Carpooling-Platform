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

    // Notify all other employees about the new ride
    const otherUsers = await prisma.user.findMany({
      where: { id: { not: user.id } },
      select: { id: true }
    });

    if (otherUsers.length > 0) {
      const notifications = otherUsers.map(u => ({
        userId: u.id,
        title: "New Ride Available",
        message: `${user.name} just published a ride going to ${data.to}.`,
      }));
      await prisma.notification.createMany({ data: notifications });
    }

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

    // Notify the driver
    await prisma.notification.create({
      data: {
        userId: ride.driverId,
        title: "New Seat Request",
        message: `${user.name} requested ${seats} seat(s) on your ride to ${ride.dropLocation}.`
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

export async function acceptBookingAction(bookingId: string) {
  try {
    const user = await getCurrentUserAction();
    if (!user) return { success: false, error: "Not authenticated" };

    const booking = await prisma.rideBooking.findUnique({
      where: { id: bookingId },
      include: { ride: true, passenger: true }
    });

    if (!booking) return { success: false, error: "Booking not found" };
    if (booking.ride.driverId !== user.id) return { success: false, error: "Not authorized" };

    if (booking.ride.availableSeats < booking.seatsBooked) {
      return { success: false, error: "Not enough seats available" };
    }

    // Update booking status
    await prisma.rideBooking.update({
      where: { id: bookingId },
      data: { status: "APPROVED" }
    });

    // Reduce available seats
    await prisma.ride.update({
      where: { id: booking.rideId },
      data: { availableSeats: booking.ride.availableSeats - booking.seatsBooked }
    });

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
        message: `${user.name} accepted your seat request for the ride to ${booking.ride.dropLocation}.`
      }
    });

    revalidatePath("/employee");
    return { success: true };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Failed to accept booking" };
  }
}

export async function rejectBookingAction(bookingId: string) {
  try {
    const user = await getCurrentUserAction();
    if (!user) return { success: false, error: "Not authenticated" };

    const booking = await prisma.rideBooking.findUnique({
      where: { id: bookingId },
      include: { ride: true }
    });

    if (!booking) return { success: false, error: "Booking not found" };
    if (booking.ride.driverId !== user.id) return { success: false, error: "Not authorized" };

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
        message: `${user.name} rejected your seat request for the ride to ${booking.ride.dropLocation}.`
      }
    });

    revalidatePath("/employee");
    return { success: true };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Failed to reject booking" };
  }
}
