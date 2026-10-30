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
  timestamp: string;
}

export interface IRemarkItem {
  author: string;
  role: 'admin' | 'citizen' | 'system';
  comment: string;
  timestamp: string;
}

export interface IComplaint {
  _id: string;
  trackingId: string;
  citizenId?: string;
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
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'citizen' | 'admin';
  address?: string;
  city?: string;
  createdAt?: string;
}

export interface AnalyticsSummary {
  total: number;
  submitted: number;
  inProgress: number;
  resolved: number;
  rejected: number;
  resolutionRate: number;
}

export interface AnalyticsData {
  summary: AnalyticsSummary;
  categoryBreakdown: { category: string; count: number }[];
  departmentBreakdown: { department: string; count: number }[];
  priorityBreakdown: { priority: string; count: number }[];
  recentActivity: Partial<IComplaint>[];
}

export interface PublicStats {
  totalGrievancesLogged: number;
  resolvedGrievances: number;
  activeResolution: number;
  resolutionRatePercent: number;
  avgResponseHours: number;
}
