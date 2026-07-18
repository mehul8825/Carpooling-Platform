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
    
    // Broadcast a newly published ride to everyone
    socket.on('new_ride_published', (ride: any) => {
      socket.broadcast.emit('ride_available', ride);
      console.log('Broadcasted new ride:', ride.id);
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
