import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { SavingsGoalModel } from '../models/SavingsGoal';
import { isDbConnected } from '../config/database';
import { INITIAL_SAVINGS_GOALS } from '../../src/data/mockGoals';

/**
 * GET /api/users/:userId/goals
 * Retrieve all savings goals for a user
 */
export async function getGoals(req: Request, res: Response) {
  const { userId } = req.params;

  if (!userId || typeof userId !== 'string') {
    return res.status(400).json({ error: 'Valid user ID is required' });
  }

  if (!isDbConnected()) {
    if (userId === 'usr-ahmed-01') {
      return res.json(INITIAL_SAVINGS_GOALS);
    }
    return res.status(503).json({
      error: 'Database is currently offline. Running in standalone fallback mode.',
    });
  }

  try {
    let goals = await SavingsGoalModel.find({ userId }).sort({ createdAt: -1 });

    // Auto-seed initial goals if demo user has no records in MongoDB
    if (goals.length === 0 && userId === 'usr-ahmed-01') {
      const seedData = INITIAL_SAVINGS_GOALS.map((g) => ({
        customId: g.id,
        userId: 'usr-ahmed-01',
        name: g.title,
        title: g.title,
        category: g.category,
        icon: g.icon,
        targetAmount: g.targetAmount,
        currentAmount: g.currentAmount,
        deadline: g.deadline,
        monthlyPace: g.monthlyPace,
        accountVault: g.accountVault,
        status: g.status,
        color: g.color || '#006c49',
        notes: g.notes || '',
        milestones: g.milestones || [],
      }));

      await SavingsGoalModel.insertMany(seedData);
      goals = await SavingsGoalModel.find({ userId }).sort({ createdAt: -1 });
    }

    return res.json(goals);
  } catch (error: any) {
    console.error('Error fetching savings goals:', error.message);
    return res.status(500).json({ error: 'Internal server error fetching savings goals' });
  }
}

/**
 * POST /api/users/:userId/goals
 * Create a new savings goal for a user
 */
export async function createGoal(req: Request, res: Response) {
  const { userId } = req.params;
  const {
    id,
    name,
    title,
    category,
    icon,
    targetAmount,
    currentAmount,
    deadline,
    monthlyPace,
    accountVault,
    status,
    color,
    notes,
    milestones,
  } = req.body;

  if (!userId || typeof userId !== 'string') {
    return res.status(400).json({ error: 'Valid user ID is required' });
  }

  const goalName = (name || title || '').trim();
  if (!goalName) {
    return res.status(400).json({ error: 'Goal name or title is required' });
  }

  const parsedTarget = typeof targetAmount === 'number' ? targetAmount : parseFloat(targetAmount);
  if (isNaN(parsedTarget) || parsedTarget <= 0) {
    return res.status(400).json({ error: 'Target amount must be a positive number greater than zero' });
  }

  const parsedCurrent = currentAmount !== undefined ? (typeof currentAmount === 'number' ? currentAmount : parseFloat(currentAmount)) : 0;
  if (isNaN(parsedCurrent) || parsedCurrent < 0) {
    return res.status(400).json({ error: 'Current amount cannot be negative' });
  }

  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!deadline || !dateRegex.test(deadline)) {
    return res.status(400).json({ error: 'Deadline date is required in YYYY-MM-DD format' });
  }

  if (!isDbConnected()) {
    const fallbackGoal = {
      id: id || `goal-${Date.now()}`,
      userId,
      name: goalName,
      title: goalName,
      category: category || 'General Savings',
      icon: icon || '🎯',
      targetAmount: parsedTarget,
      currentAmount: parsedCurrent,
      deadline,
      monthlyPace: monthlyPace ? Number(monthlyPace) : 0,
      accountVault: accountVault || 'bKash Liquid Vault',
      status: status || 'On Track',
      color: color || '#006c49',
      notes: notes || '',
      milestones: milestones || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return res.status(201).json(fallbackGoal);
  }

  try {
    const newGoal = await SavingsGoalModel.create({
      customId: id || `goal-${Date.now()}`,
      userId,
      name: goalName,
      title: goalName,
      category: category || 'General Savings',
      icon: icon || '🎯',
      targetAmount: parsedTarget,
      currentAmount: parsedCurrent,
      deadline,
      monthlyPace: monthlyPace ? Number(monthlyPace) : 0,
      accountVault: accountVault || 'bKash Liquid Vault',
      status: status || 'On Track',
      color: color || '#006c49',
      notes: notes || '',
      milestones: milestones || [],
    });

    return res.status(201).json(newGoal);
  } catch (error: any) {
    console.error('Error creating savings goal:', error.message);
    return res.status(500).json({ error: error.message || 'Internal server error creating savings goal' });
  }
}

/**
 * PUT /api/goals/:id
 * Update an existing savings goal
 */
export async function updateGoal(req: Request, res: Response) {
  const { id } = req.params;
  const updates = req.body;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Valid goal ID is required' });
  }

  if (!updates || typeof updates !== 'object') {
    return res.status(400).json({ error: 'Update payload must be an object' });
  }

  delete updates._id;
  delete updates.createdAt;

  if (updates.name && !updates.title) updates.title = updates.name;
  if (updates.title && !updates.name) updates.name = updates.title;

  if (!isDbConnected()) {
    return res.json({
      ...updates,
      id,
      updatedAt: new Date().toISOString(),
    });
  }

  try {
    const isObjectId = mongoose.Types.ObjectId.isValid(id);
    const query = {
      $or: [
        ...(isObjectId ? [{ _id: id }] : []),
        { customId: id },
      ],
    };

    const updatedGoal = await SavingsGoalModel.findOneAndUpdate(query, { $set: updates }, { new: true, runValidators: true });

    if (!updatedGoal) {
      return res.status(404).json({ error: 'Savings goal not found' });
    }

    return res.json(updatedGoal);
  } catch (error: any) {
    console.error('Error updating savings goal:', error.message);
    return res.status(500).json({ error: error.message || 'Internal server error updating savings goal' });
  }
}

/**
 * DELETE /api/goals/:id
 * Delete a savings goal
 */
export async function deleteGoal(req: Request, res: Response) {
  const { id } = req.params;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Valid goal ID is required' });
  }

  if (!isDbConnected()) {
    return res.json({ message: 'Goal removed successfully (in-memory mode)', id });
  }

  try {
    const isObjectId = mongoose.Types.ObjectId.isValid(id);
    const query = {
      $or: [
        ...(isObjectId ? [{ _id: id }] : []),
        { customId: id },
      ],
    };

    const deleted = await SavingsGoalModel.findOneAndDelete(query);
    if (!deleted) {
      return res.status(404).json({ error: 'Savings goal not found' });
    }

    return res.json({ message: 'Goal deleted successfully', id });
  } catch (error: any) {
    console.error('Error deleting savings goal:', error.message);
    return res.status(500).json({ error: 'Internal server error deleting savings goal' });
  }
}
