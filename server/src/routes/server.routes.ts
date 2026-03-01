import { Router } from 'express';
import * as serverController from '../controllers/server.controller';
import { authMiddleware } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createServerSchema, joinServerSchema } from '../validators/server.schema';

const router = Router();

router.use(authMiddleware);

router.post('/', validate(createServerSchema), serverController.create);
router.get('/my', serverController.getUserServers);
router.post('/join', validate(joinServerSchema), serverController.join);
router.get('/:serverId', serverController.get);
router.delete('/:serverId', serverController.remove);
router.get('/:serverId/members', serverController.getMembers);
router.get('/:serverId/invite', serverController.getInviteCode);

export default router;
