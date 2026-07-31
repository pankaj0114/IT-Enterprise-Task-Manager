// models/User.js
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Invalid email format'],
    },
    password: { type: String, required: true, minlength: 8, select: false },
    role: {
      type: String,
      enum: ['super_admin', 'admin', 'hr_manager', 'employee'],
      default: 'employee',
      required: true,
    },
    department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
    designation: { type: String, trim: true },
    avatar: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
    refreshTokens: [
      {
        token: { type: String, required: true },
        createdAt: { type: Date, default: Date.now, expires: '30d' },
        userAgent: String,
        ip: String,
      },
    ],
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    lastLogin: Date,
  },
  { timestamps: true },
);

// Helpful indexes
userSchema.index({ role: 1 });
userSchema.index({ department: 1 });

// ✅ Default export for ES Modules
const User = mongoose.model('User', userSchema);
export default User;
