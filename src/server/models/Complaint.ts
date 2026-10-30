import mongoose, { Schema, Document } from 'mongoose';

export type ComplaintCategory =
  | 'Water Supply'
  | 'Roads'
  | 'Electricity'
  | 'Sanitation'
  | 'Public Safety'
  | 'Other';

export type ComplaintStatus = 'Submitted' | 'In Progress' | 'Resolved' | 'Rejected';

export type ComplaintPriority = 'Low' | 'Medium' | 'High' | 'Emergency';

export interface ITimelineItem {
  action: string;
  status: ComplaintStatus;
  performedBy: string;
  note?: string;
  timestamp: Date;
}

export interface IRemarkItem {
  author: string;
  role: 'admin' | 'citizen' | 'system';
  comment: string;
  timestamp: Date;
}

export interface IComplaint extends Document {
  _id: mongoose.Types.ObjectId;
  trackingId: string;
  citizenId?: mongoose.Types.ObjectId;
  citizenName: string;
  citizenEmail: string;
  citizenPhone: string;
  category: ComplaintCategory;
  title: string;
  description: string;
  location: {
    address: string;
    city: string;
    landmark?: string;
    pincode?: string;
  };
  priority: ComplaintPriority;
  assignedDepartment: string;
  status: ComplaintStatus;
  remarks: IRemarkItem[];
  timeline: ITimelineItem[];
  resolutionNote?: string;
  rejectionReason?: string;
  resolvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const TimelineItemSchema = new Schema<ITimelineItem>(
  {
    action: { type: String, required: true },
    status: {
      type: String,
      enum: ['Submitted', 'In Progress', 'Resolved', 'Rejected'],
      required: true,
    },
    performedBy: { type: String, required: true },
    note: { type: String, default: '' },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

const RemarkItemSchema = new Schema<IRemarkItem>(
  {
    author: { type: String, required: true },
    role: { type: String, enum: ['admin', 'citizen', 'system'], default: 'admin' },
    comment: { type: String, required: true, trim: true },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

const ComplaintSchema = new Schema<IComplaint>(
  {
    trackingId: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      index: true,
      trim: true,
    },
    citizenId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    citizenName: {
      type: String,
      required: [true, 'Citizen name is required'],
      trim: true,
    },
    citizenEmail: {
      type: String,
      required: [true, 'Citizen email is required'],
      trim: true,
      lowercase: true,
      index: true,
    },
    citizenPhone: {
      type: String,
      required: [true, 'Citizen phone number is required'],
      trim: true,
    },
    category: {
      type: String,
      enum: ['Water Supply', 'Roads', 'Electricity', 'Sanitation', 'Public Safety', 'Other'],
      required: [true, 'Complaint category is required'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Complaint title is required'],
      trim: true,
      minlength: [5, 'Title must be at least 5 characters'],
      maxlength: [150, 'Title cannot exceed 150 characters'],
      index: true,
    },
    description: {
      type: String,
      required: [true, 'Complaint description is required'],
      trim: true,
      minlength: [10, 'Detailed description must be at least 10 characters'],
    },
    location: {
      address: { type: String, required: [true, 'Location address is required'], trim: true },
      city: { type: String, required: [true, 'City/Municipality is required'], trim: true },
      landmark: { type: String, trim: true, default: '' },
      pincode: { type: String, trim: true, default: '' },
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Emergency'],
      default: 'Medium',
      index: true,
    },
    assignedDepartment: {
      type: String,
      default: 'Unassigned',
      index: true,
    },
    status: {
      type: String,
      enum: ['Submitted', 'In Progress', 'Resolved', 'Rejected'],
      default: 'Submitted',
      index: true,
    },
    remarks: [RemarkItemSchema],
    timeline: [TimelineItemSchema],
    resolutionNote: { type: String, default: '' },
    rejectionReason: { type: String, default: '' },
    resolvedAt: { type: Date },
  },
  {
    timestamps: true,
  }
);

// Helper function to generate standardized CivicTrack ID: CT-YYYY-XXXXX
export function generateTrackingId(): string {
  const year = new Date().getFullYear();
  const randomChars = Math.random().toString(36).substring(2, 7).toUpperCase();
  const timestampSuffix = Date.now().toString().slice(-3);
  return `CT-${year}-${randomChars}${timestampSuffix}`;
}

export const Complaint =
  mongoose.models.Complaint || mongoose.model<IComplaint>('Complaint', ComplaintSchema);
