import { Router } from 'express';
import * as channelController from '../controllers/channel.controller';
import { authMiddleware } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createChannelSchema, updateChannelSchema } from '../validators/channel.schema';

const router = Router();

router.use(authMiddleware);

router.get('/servers/:serverId/channels', channelController.getChannels);
router.post('/servers/:serverId/channels', validate(createChannelSchema), channelController.create);
router.patch('/channels/:channelId', validate(updateChannelSchema), channelController.update);
router.delete('/channels/:channelId', channelController.remove);

export default router;
