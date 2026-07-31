import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // employee email
    assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    assignDate: { type: Date, required: true },
    dueDate: { type: Date, required: true },
    estimatedHours: { type: Number },
    priority: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH'],
      default: 'MEDIUM',
    },
    tags: [{ type: String }],
    status: {
      type: String,
      enum: ['Not Started', 'In Progress', 'Completed', 'Pending Review'],
      default: 'Not Started',
    },
  },

  { timestamps: true },
);

export default mongoose.model('Task', taskSchema);
