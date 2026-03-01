import { Router } from 'express';
import * as friendController from '../controllers/friend.controller';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.use(authMiddleware);

router.get('/', friendController.getFriends);
router.get('/requests', friendController.getPendingRequests);
router.post('/request', friendController.sendRequest);
router.post('/accept/:friendshipId', friendController.acceptRequest);
router.post('/decline/:friendshipId', friendController.declineRequest);
router.delete('/:friendshipId', friendController.removeFriend);
router.post('/block/:userId', friendController.blockUser);

export default router;
