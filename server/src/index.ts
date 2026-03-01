import { createServer } from 'http';
import app from './app';
import { env } from './config/env';
import { setupSocket } from './socket';

const httpServer = createServer(app);

setupSocket(httpServer);

httpServer.listen(env.PORT, () => {
  console.log(`Talky server running on http://localhost:${env.PORT}`);
});
