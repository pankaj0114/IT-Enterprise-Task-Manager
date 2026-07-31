import mongoose from 'mongoose';

const clientSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String },
    company: { type: String },
    phone: { type: String },
    notes: { type: String },
  },
  { timestamps: true },
);

export default mongoose.model('Client', clientSchema);
