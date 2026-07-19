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
    // User searching for rides joins a global search room
    socket.on('join_search_room', () => {
      socket.join('search_room');
      console.log(`Socket ${socket.id} joined search room`);
    });

    // Broadcast a newly published ride to all searchers
    socket.on('new_ride_published', (ride: any) => {
      socket.to('search_room').emit('ride_available', ride);
      console.log(`Broadcasted new ride ${ride.id} to search room`);
    });

    // Ride Tracking Rooms
    socket.on('join_ride_room', (rideId: string) => {
      socket.join(`ride:${rideId}`);
      console.log(`Socket ${socket.id} joined ride room ${rideId}`);
    });

    socket.on('update_ride_location', ({ rideId, lat, lng }: { rideId: string, lat: number, lng: number }) => {
      socket.to(`ride:${rideId}`).emit('ride_location_updated', { rideId, lat, lng });
    });

    socket.on('complete_ride', (rideId: string) => {
      io.to(`ride:${rideId}`).emit('ride_completed', rideId);
      console.log(`Ride ${rideId} completed`);
    });

    // Relay a booking request specifically to the driver
    socket.on('booking_requested', ({ driverId, booking, rideId }: { driverId: string, booking: any, rideId: string }) => {
      io.to(driverId).emit('new_booking_request', { booking, rideId });
      io.to(driverId).emit('new_notification');
      console.log(`Relayed booking request to driver ${driverId}`);
    });

    // Relay a booking cancellation to the driver
    socket.on('cancel_booking', ({ driverId, bookingId }: { driverId: string, bookingId: string }) => {
      io.to(driverId).emit('booking_cancelled', bookingId);
      console.log(`Relayed booking cancellation to driver ${driverId}`);
    });

    // Relay booking status update (approve/reject) to the passenger
    socket.on('booking_updated', ({ passengerId, bookingId, status, rideId }: { passengerId: string, bookingId: string, status: string, rideId: string }) => {
      io.to(passengerId).emit('booking_status_changed', { bookingId, status, rideId });
      io.to(passengerId).emit('new_notification');
      console.log(`Relayed booking update to passenger ${passengerId}`);
    });

    // Chat functionality
    socket.on('send_chat_message', ({ toUserId, text, senderId }: { toUserId: string, text: string, senderId: string }) => {
      io.to(toUserId).emit('receive_chat_message', { senderId, toUserId, text, timestamp: Date.now() });
      console.log(`Relayed chat message from ${senderId} to ${toUserId}`);
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
