import { Router } from 'express';
import authRoutes from './auth.routes';
import serverRoutes from './server.routes';
import channelRoutes from './channel.routes';
import messageRoutes from './message.routes';
import dmRoutes from './dm.routes';
import userRoutes from './user.routes';
import friendRoutes from './friend.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/servers', serverRoutes);
router.use('/', channelRoutes);
router.use('/', messageRoutes);
router.use('/dm', dmRoutes);
router.use('/users', userRoutes);
router.use('/friends', friendRoutes);

export default router;
