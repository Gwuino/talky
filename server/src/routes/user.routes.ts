import { Router } from 'express';
import * as userController from '../controllers/user.controller';
import { authMiddleware } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { updateProfileSchema } from '../validators/user.schema';

const router = Router();

router.use(authMiddleware);

router.get('/search', userController.searchUsers);
router.get('/:userId', userController.getUser);
router.patch('/me', validate(updateProfileSchema), userController.updateProfile);

export default router;
