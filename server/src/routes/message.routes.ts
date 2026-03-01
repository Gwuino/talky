import { Router } from 'express';
import * as messageController from '../controllers/message.controller';
import { authMiddleware } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { sendMessageSchema, updateMessageSchema } from '../validators/message.schema';

const router = Router();

router.use(authMiddleware);

router.get('/channels/:channelId/messages', messageController.getMessages);
router.post('/channels/:channelId/messages', validate(sendMessageSchema), messageController.create);
router.patch('/messages/:messageId', validate(updateMessageSchema), messageController.update);
router.delete('/messages/:messageId', messageController.remove);

export default router;
