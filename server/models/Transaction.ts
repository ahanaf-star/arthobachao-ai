import mongoose, { Document, Schema } from 'mongoose';

export interface ITransaction extends Document {
  customId?: string;
  userId: string;
  type: 'expense' | 'income' | 'transfer';
  amount: number;
  category: string;
  description: string;
  date: string;
  merchant?: string;
  account?: string;
  paymentMethod?: string;
  classification?: 'essential' | 'discretionary' | 'anomalies';
  fee?: number;
  location?: string;
  isRecurring?: boolean;
  createdAt: Date;
  updatedAt?: Date;
}

const TransactionSchema = new Schema<ITransaction>(
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
    type: {
      type: String,
      enum: {
        values: ['expense', 'income', 'transfer'],
        message: '{VALUE} is not a valid transaction type',
      },
      required: [true, 'Transaction type is required'],
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0.01, 'Amount must be greater than zero'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
    },
    date: {
      type: String,
      required: [true, 'Date is required (YYYY-MM-DD)'],
      match: [/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'],
      index: true,
    },
    merchant: {
      type: String,
      default: '',
      trim: true,
    },
    account: {
      type: String,
      default: 'bKash',
    },
    paymentMethod: {
      type: String,
      default: 'Direct Transfer',
    },
    classification: {
      type: String,
      enum: ['essential', 'discretionary', 'anomalies'],
      default: 'essential',
    },
    fee: {
      type: Number,
      default: 0,
    },
    location: {
      type: String,
      default: 'Dhaka',
    },
    isRecurring: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret: any) => {
        ret.id = ret.customId || ret._id.toString();
        delete ret.__v;
        return ret;
      },
    },
  }
);

TransactionSchema.index({ userId: 1, date: -1 });

export const TransactionModel =
  mongoose.models.Transaction || mongoose.model<ITransaction>('Transaction', TransactionSchema);
