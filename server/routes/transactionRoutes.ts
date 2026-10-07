import { Router } from 'express';
import {
  getTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
} from '../controllers/transactionController';
import { optionalAuth, requireAuth } from '../middleware/authMiddleware';

const router = Router({ mergeParams: true });

router.get('/:userId/transactions', optionalAuth, getTransactions);
router.post('/:userId/transactions', requireAuth, createTransaction);
router.put('/:userId/transactions/:txId', requireAuth, updateTransaction);
router.delete('/:userId/transactions/:txId', requireAuth, deleteTransaction);
router.get('/transactions', requireAuth, getTransactions);
router.post('/transactions', requireAuth, createTransaction);
router.put('/transactions/:id', requireAuth, updateTransaction);
router.delete('/transactions/:id', requireAuth, deleteTransaction);

export default router;
