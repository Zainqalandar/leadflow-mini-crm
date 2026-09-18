import { HydratedDocument, Schema, model } from "mongoose";
import { LEAD_SOURCES, LEAD_STATUSES, LeadSource, LeadStatus } from "../constants/lead";

export interface Lead {
  name: string;
  email: string;
  phone: string;
  normalizedPhone: string;
  service: string;
  budgetRange: string;
  message: string;
  status: LeadStatus;
  source: LeadSource;
  leadScore: number;
  createdAt: Date;
  updatedAt: Date;
}

export type LeadDocument = HydratedDocument<Lead>;

const leadSchema = new Schema<Lead>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 254,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
      maxlength: 30,
    },
    normalizedPhone: {
      type: String,
      required: true,
      trim: true,
      select: false,
    },
    service: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    budgetRange: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    message: {
      type: String,
      required: true,
      trim: true,
      minlength: 10,
      maxlength: 2000,
    },
    status: {
      type: String,
      enum: LEAD_STATUSES,
      default: "New",
    },
    source: {
      type: String,
      enum: LEAD_SOURCES,
      required: true,
    },
    leadScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
  },
  { timestamps: true },
);

// A re-submission is considered duplicate when both the email and normalized phone match.
leadSchema.index({ email: 1, normalizedPhone: 1 }, { unique: true });
leadSchema.index({ status: 1, createdAt: -1 });
leadSchema.index({ leadScore: -1, createdAt: -1 });

const LeadModel = model<Lead>("Lead", leadSchema);

export default LeadModel;
