import mongoose from "mongoose";

const schema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 120 },
  contactName: { type: String, trim: true, maxlength: 120 },
  email: { type: String, trim: true, maxlength: 254 },
  phone: { type: String, trim: true, maxlength: 40 },
  address: { type: String, trim: true, maxlength: 500 },
  notes: { type: String, trim: true, maxlength: 1000 },
  active: { type: Boolean, default: true },
}, { timestamps: true });
schema.index({ active: 1, name: 1 });
export default mongoose.model("Supplier", schema);
