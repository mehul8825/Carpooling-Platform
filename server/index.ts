import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { Server as SocketIOServer, Socket } from 'socket.io';

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = 3000;
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url!, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  const io = new SocketIOServer(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  io.on('connection', (socket: Socket) => {
    console.log('A user connected:', socket.id);

    // Users join a personal room based on their userId
    socket.on('join_user', (userId: string) => {
      socket.join(userId);
      console.log(`Socket ${socket.id} joined personal room ${userId}`);
    });
    // User searching for rides joins a geo-based room (approx 11km grid)
    socket.on('join_geo_room', ({ lat, lng }: { lat: number, lng: number }) => {
      const geoRoom = `geo:${Math.round(lat * 10) / 10}:${Math.round(lng * 10) / 10}`;
      socket.join(geoRoom);
      console.log(`Socket ${socket.id} joined geo room ${geoRoom}`);
    });

    // Broadcast a newly published ride to the specific geo-room
    socket.on('new_ride_published', (ride: any) => {
      const geoRoom = `geo:${Math.round(ride.pickupLat * 10) / 10}:${Math.round(ride.pickupLng * 10) / 10}`;
      socket.to(geoRoom).emit('ride_available', ride);
      console.log(`Broadcasted new ride ${ride.id} to geo room ${geoRoom}`);
    });

    // Ride Tracking Rooms
    socket.on('join_ride_room', (rideId: string) => {
      socket.join(`ride:${rideId}`);
      console.log(`Socket ${socket.id} joined ride room ${rideId}`);
    });

    socket.on('update_ride_location', ({ rideId, lat, lng }: { rideId: string, lat: number, lng: number }) => {
      socket.to(`ride:${rideId}`).emit('ride_location_updated', { rideId, lat, lng });
    });

    // Relay a booking request specifically to the driver
    socket.on('booking_requested', ({ driverId, booking }: { driverId: string, booking: any }) => {
      io.to(driverId).emit('new_booking_request', booking);
      console.log(`Relayed booking request to driver ${driverId}`);
    });

    // Relay booking status update (approve/reject) to the passenger
    socket.on('booking_updated', ({ passengerId, bookingId, status }: { passengerId: string, bookingId: string, status: string }) => {
      io.to(passengerId).emit('booking_status_changed', { bookingId, status });
      console.log(`Relayed booking update to passenger ${passengerId}`);
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
  });

  server.once('error', (err) => {
    console.error(err);
    process.exit(1);
  });

  server.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});
