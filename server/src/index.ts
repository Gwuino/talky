import { createServer } from 'http';
import app from './app';
import { env } from './config/env';
import { setupSocket } from './socket';
import prisma from './config/database';

const httpServer = createServer(app);

const io = setupSocket(httpServer);

httpServer.listen(env.PORT, () => {
  console.log(`Talky server running on http://localhost:${env.PORT}`);
});

// Graceful shutdown
async function shutdown(signal: string) {
  console.log(`\n${signal} received. Shutting down gracefully...`);

  // Close socket connections
  io.disconnectSockets(true);

  // Close HTTP server
  httpServer.close(() => {
    console.log('HTTP server closed');
  });

  // Disconnect Prisma
  await prisma.$disconnect();
  console.log('Database disconnected');

  process.exit(0);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
