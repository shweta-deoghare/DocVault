import mongoose from "mongoose";

const masterSheetUserSchema = new mongoose.Schema({
  companyName: { type: String, required: true },
  email: { type: String, required: true },
  contactNumber: { type: String },
  masterSheetData: { type: Object }, 
}, { timestamps: true });

export default mongoose.model("MasterSheetUser", masterSheetUserSchema);