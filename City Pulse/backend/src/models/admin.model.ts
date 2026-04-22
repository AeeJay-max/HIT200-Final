import { model, Schema } from "mongoose";

const AdminSchema = new Schema(
  {
    fullName: { type: String, required: true },
    password: {
      type: String,
      required: [true],
      min: [8],
    },
    email: { type: String, required: true, lowercase: true },
    phonenumber: {
      type: String,
      required: [true],
    },
    department: { type: String, required: false },
    role: { type: String, enum: ["MAIN_ADMIN", "DEPARTMENT_ADMIN"], default: "DEPARTMENT_ADMIN" },
    adminAccessCode: { type: Number, required: true, unique: true },
    pushSubscription: { type: Schema.Types.Mixed }, // Web Push Subscription object
    isActive: { type: Boolean, default: true },
    deactivatedBy: { type: Schema.Types.ObjectId, ref: "Admin" },
  },
  { timestamps: true }
);

export const AdminModel = model("Admin", AdminSchema);
