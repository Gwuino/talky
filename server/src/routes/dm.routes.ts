import { Router } from 'express';
import * as dmController from '../controllers/dm.controller';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.use(authMiddleware);

router.get('/conversations', dmController.getConversations);
router.post('/conversations', dmController.createConversation);
router.get('/conversations/:conversationId/messages', dmController.getMessages);

export default router;
