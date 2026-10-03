import mongoose, { Document, Schema } from 'mongoose';

export interface ISavingsGoal extends Document {
  customId?: string;
  userId: string;
  name: string;
  title: string; // Synced with name for backward compatibility
  category?: string;
  icon?: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  monthlyPace?: number;
  accountVault?: string;
  status: 'On Track' | 'At Risk' | 'Completed';
  color?: string;
  notes?: string;
  milestones?: Array<{
    amount: number;
    hit: boolean;
    label: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const SavingsGoalSchema = new Schema<ISavingsGoal>(
  {
    customId: {
      type: String,
      sparse: true,
      index: true,
    },
    userId: {
      type: String,
      required: [true, 'User ID is required'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Goal name is required'],
      trim: true,
    },
    title: {
      type: String,
      trim: true,
    },
    category: {
      type: String,
      default: 'General Savings',
    },
    icon: {
      type: String,
      default: '🎯',
    },
    targetAmount: {
      type: Number,
      required: [true, 'Target amount is required'],
      min: [1, 'Target amount must be at least 1'],
    },
    currentAmount: {
      type: Number,
      default: 0,
      min: [0, 'Current amount cannot be negative'],
    },
    deadline: {
      type: String,
      required: [true, 'Deadline date is required'],
      match: [/^\d{4}-\d{2}-\d{2}$/, 'Deadline must be in YYYY-MM-DD format'],
    },
    monthlyPace: {
      type: Number,
      default: 0,
    },
    accountVault: {
      type: String,
      default: 'bKash Liquid Vault',
    },
    status: {
      type: String,
      enum: ['On Track', 'At Risk', 'Completed'],
      default: 'On Track',
    },
    color: {
      type: String,
      default: '#006c49',
    },
    notes: {
      type: String,
      default: '',
    },
    milestones: [
      {
        amount: { type: Number, required: true },
        hit: { type: Boolean, default: false },
        label: { type: String, default: '' },
      },
    ],
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret: any) => {
        ret.id = ret.customId || ret._id.toString();
        // Ensure both name and title are accessible
        ret.title = ret.title || ret.name;
        ret.name = ret.name || ret.title;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Pre-save hook to ensure name and title stay synced
SavingsGoalSchema.pre('save', function () {
  if (this.name && !this.title) {
    this.title = this.name;
  } else if (this.title && !this.name) {
    this.name = this.title;
  }
});

export const SavingsGoalModel =
  mongoose.models.SavingsGoal || mongoose.model<ISavingsGoal>('SavingsGoal', SavingsGoalSchema);
