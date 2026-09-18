import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, minlength: 6 },
  authProvider: {
    type: String,
    enum: ["local", "google"],
    default: "local",
  },
  googleId: { type: String, unique: true, sparse: true },
  role: {
    type: String,
    enum: ["customer", "owner"],
    default: "customer",
  },
  phone: { type: String, trim: true },
  address: { type: String, trim: true },
}, { timestamps: true });

const User = mongoose.model("User", userSchema);

export default User;
