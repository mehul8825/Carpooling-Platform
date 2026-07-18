import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { Server } from 'socket.io';

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = 3000;
// when using middleware `hostname` and `port` must be provided below
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  const driverLocations = new Map();

  io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);
    
    // Join a specific trip room
    socket.on('join_trip', ({ tripId }) => {
      socket.join(`trip_${tripId}`);
      console.log(`Socket ${socket.id} joined trip_${tripId}`);
    });

    // Driver emits location
    socket.on('driver_location_update', ({ tripId, driverId, lat, lng }) => {
      driverLocations.set(driverId, { lat, lng, lastSeen: Date.now(), tripId });
      io.to(`trip_${tripId}`).emit('location_update', { lat, lng });
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
  });

  // Edge Case A: Driver Loses Internet
  // Periodically check if driver hasn't updated in 30 seconds
  setInterval(() => {
    const now = Date.now();
    for (const [driverId, data] of driverLocations.entries()) {
      if (now - data.lastSeen > 30000) {
        io.to(`trip_${data.tripId}`).emit('driver_offline', { driverId });
        driverLocations.delete(driverId);
      }
    }
  }, 10000);

  server.once('error', (err) => {
    console.error(err);
    process.exit(1);
  });

  server.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});
