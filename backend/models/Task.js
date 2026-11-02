import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    remarks: {
      type: String,
      default: '',
    },

    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Urgent'],
      default: 'Medium',
    },

    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
      default: null,
    },

    issueDate: {
      type: Date,
      default: Date.now,
      immutable: true,
    },

    dueDate: {
      type: Date,
      required: false,
      default: null,
    },

    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // Actual time spent completing the task
    totalHours: {
      type: Number,
      min: 0,
      default: 0,
    },

    totalMinutes: {
      type: Number,
      min: 0,
      max: 59,
      default: 0,
    },

    // Expected time set by Admin/HR when assigning the task
    estimatedMinutes: {
      type: Number,
      min: 0,
      default: 0,
    },

    // Date and time when the task was completed
    completedAt: {
      type: Date,
      default: null,
    },

    // Admin/HR quality review (1 to 5)
    qualityRating: {
      type: Number,
      min: 1,
      max: 5,
      default: null,
    },

    status: {
      type: String,
      enum: ['Not Started', 'In Progress', 'Completed'],
      default: 'Not Started',
    },

    tags: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  },
);

export default mongoose.model('Task', taskSchema);
