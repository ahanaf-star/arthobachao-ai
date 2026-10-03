import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserModel, IUser } from '../models/User';
import { isDbConnected } from '../config/database';
import { INITIAL_USER } from '../../src/data/mockUser';

export interface AuthenticatedRequest extends Request {
  user?: any;
  userId?: string;
}

const JWT_SECRET = process.env.JWT_SECRET || 'arthobachao_secure_jwt_secret_key_2026_dev';

/**
 * Middleware that strictly requires a valid JWT authentication token
 */
export async function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Access denied. Authentication token required.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; customId?: string; email: string };

    if (!isDbConnected()) {
      // In offline fallback mode, mock authenticated user
      req.user = {
        ...INITIAL_USER,
        id: decoded.customId || decoded.id || INITIAL_USER.id,
      };
      req.userId = req.user.id;
      return next();
    }

    // Look up user in MongoDB by _id or customId
    const user = await UserModel.findOne({
      $or: [
        ...(decoded.id ? [{ _id: decoded.id }] : []),
        ...(decoded.customId ? [{ customId: decoded.customId }] : []),
        ...(decoded.email ? [{ email: decoded.email.toLowerCase() }] : []),
      ],
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid authentication session. User not found.' });
    }

    req.user = user;
    req.userId = user.customId || user._id.toString();
    next();
  } catch (err: any) {
    return res.status(401).json({ error: 'Invalid or expired authentication token.' });
  }
}

/**
 * Optional authentication middleware: attaches user if token is present and valid,
 * but allows unauthenticated requests to proceed.
 */
export async function optionalAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;

  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; customId?: string; email: string };

    if (isDbConnected()) {
      const user = await UserModel.findOne({
        $or: [
          ...(decoded.id ? [{ _id: decoded.id }] : []),
          ...(decoded.customId ? [{ customId: decoded.customId }] : []),
          ...(decoded.email ? [{ email: decoded.email.toLowerCase() }] : []),
        ],
      });
      if (user) {
        req.user = user;
        req.userId = user.customId || user._id.toString();
      }
    }
  } catch (e) {
    // Ignore invalid tokens in optional auth
  }

  next();
}
