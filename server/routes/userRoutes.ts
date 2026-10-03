import { Router } from 'express';
import { getUser, updateUser, createUser } from '../controllers/userController';
import { optionalAuth } from '../middleware/authMiddleware';

const router = Router();

router.use(optionalAuth);
router.post('/', createUser);
router.get('/:id', getUser);
router.put('/:id', updateUser);

export default router;

