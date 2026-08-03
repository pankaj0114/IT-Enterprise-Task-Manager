import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    remarks: { type: String }, // ✅ renamed from description
    dueDate: { type: Date },
    priority: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
      default: 'MEDIUM',
    },
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
      default: null,
    },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // ✅ employee ID
    assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // ✅ who created/assigned
    remarks: { type: String, default: '' },
    status: {
      type: String,
      enum: ['Not Started', 'In Progress', 'Completed'],
      default: 'Not Started',
    },
    tags: [String],
  },
  { timestamps: true },
);

export default mongoose.model('Task', taskSchema);
