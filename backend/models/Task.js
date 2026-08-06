import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    remarks: { type: String }, // ✅ renamed from description
    dueDate: { type: Date },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Urgent'],
    },
    client: {
      type: String,
      ref: 'Client',
    },
    issueDate: { type: Date, default: Date.now },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // ✅ employee ID
    assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // ✅ who created/assigned
    remarks: { type: String },
    totalHours: { type: Number, default: 0 }, // ✅ add this
    totalMinutes: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['Not Started', 'In Progress', 'Completed'],
    },
    tags: [String],
  },
  { timestamps: true },
);

export default mongoose.model('Task', taskSchema);
