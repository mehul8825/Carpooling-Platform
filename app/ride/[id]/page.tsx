"use client"

import { prisma } from "@/lib/db";
import { getCurrentUserAction } from "@/app/actions/auth";
import { redirect } from "next/navigation";
import dynamic from "next/dynamic";

const LiveTrackingClient = dynamic(
  () => import("./LiveTrackingClient").then((mod) => mod.LiveTrackingClient),
  { ssr: false }
);

export default async function RideTrackingPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const user = await getCurrentUserAction();
  if (!user) redirect("/auth/signin");

  const ride = await prisma.ride.findUnique({
    where: { id: params.id },
    include: {
      driver: { select: { id: true, name: true, phone: true } },
      vehicle: true,
      bookings: {
        where: { status: "APPROVED" },
        include: { passenger: { select: { id: true, name: true } } }
      }
    }
  });

  if (!ride) {
    return <div className="p-12 text-center text-xl">Ride not found.</div>;
  }

  const isDriver = ride.driverId === user.id;
  const isPassenger = ride.bookings.some(b => b.passengerId === user.id);

  if (!isDriver && !isPassenger && user.role !== "ADMIN") {
    return <div className="p-12 text-center text-xl text-red-600">Unauthorized access to this ride.</div>;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <LiveTrackingClient ride={ride} currentUserId={user.id} isDriver={isDriver} />
    </div>
  );
}
