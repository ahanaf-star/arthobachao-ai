import { Router } from 'express';
import {
  getTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
} from '../controllers/transactionController';
import { optionalAuth } from '../middleware/authMiddleware';

const router = Router({ mergeParams: true });

router.use(optionalAuth);
router.get('/:userId/transactions', getTransactions);
router.post('/:userId/transactions', createTransaction);
router.put('/:userId/transactions/:txId', updateTransaction);
router.delete('/:userId/transactions/:txId', deleteTransaction);
router.put('/transactions/:id', updateTransaction);
router.delete('/transactions/:id', deleteTransaction);

export default router;
