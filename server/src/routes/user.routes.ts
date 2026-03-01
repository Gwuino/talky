import { Router } from 'express';
import * as userController from '../controllers/user.controller';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.use(authMiddleware);

router.get('/search', userController.searchUsers);
router.get('/:userId', userController.getUser);
router.patch('/me', userController.updateProfile);

export default router;
