import { Router } from 'express';
import type { Response } from 'express';
import mongoose from 'mongoose';
import {
  Complaint,
  generateTrackingId,
  ComplaintCategory,
  ComplaintStatus,
  ComplaintPriority,
  ITimelineItem,
  IRemarkItem,
} from '../models/Complaint.ts';
import {
  authenticateUser,
  requireAdmin,
  optionalAuth,
  AuthenticatedRequest,
  trackingRateLimiter,
} from '../middleware/auth.ts';

export const complaintsRouter = Router();

const VALID_CATEGORIES: ComplaintCategory[] = [
  'Water Supply',
  'Roads',
  'Electricity',
  'Sanitation',
  'Public Safety',
  'Other',
];

const VALID_STATUSES: ComplaintStatus[] = ['Submitted', 'In Progress', 'Resolved', 'Rejected'];
const VALID_PRIORITIES: ComplaintPriority[] = ['Low', 'Medium', 'High', 'Emergency'];

// Helper to escape regex special characters for safe search queries
function escapeRegex(text: string): string {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}

// POST /api/complaints - Submit a new public grievance
complaintsRouter.post('/', optionalAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      fullName,
      email,
      phone,
      category,
      title,
      description,
      location,
      priority,
    } = req.body;

    // Strict Input Validation
    if (!fullName || typeof fullName !== 'string' || fullName.trim().length < 2) {
      res.status(400).json({
        success: false,
        message: 'Citizen full name is required and must be at least 2 characters.',
      });
      return;
    }

    if (!email || typeof email !== 'string' || !/^\S+@\S+\.\S+$/.test(email.trim())) {
      res.status(400).json({
        success: false,
        message: 'A valid email address is required for official status notifications.',
      });
      return;
    }

    if (!phone || typeof phone !== 'string' || phone.trim().length < 7) {
      res.status(400).json({
        success: false,
        message: 'A valid contact telephone number is required.',
      });
      return;
    }

    if (!category || !VALID_CATEGORIES.includes(category as ComplaintCategory)) {
      res.status(400).json({
        success: false,
        message: `Invalid category. Must be one of: ${VALID_CATEGORIES.join(', ')}`,
      });
      return;
    }

    if (!title || typeof title !== 'string' || title.trim().length < 5) {
      res.status(400).json({
        success: false,
        message: 'Grievance title must be at least 5 characters.',
      });
      return;
    }

    if (!description || typeof description !== 'string' || description.trim().length < 10) {
      res.status(400).json({
        success: false,
        message: 'Detailed description must be at least 10 characters.',
      });
      return;
    }

    if (
      !location ||
      typeof location !== 'object' ||
      !location.address ||
      !location.city ||
      typeof location.address !== 'string' ||
      typeof location.city !== 'string' ||
      location.address.trim().length < 3 ||
      location.city.trim().length < 2
    ) {
      res.status(400).json({
        success: false,
        message: 'Valid street address and city/municipality are required.',
      });
      return;
    }

    // Generate unique tracking ID
    let trackingId = generateTrackingId();
    let existing = await Complaint.findOne({ trackingId });
    while (existing) {
      trackingId = generateTrackingId();
      existing = await Complaint.findOne({ trackingId });
    }

    // Default department routing
    const departmentRouting: Record<ComplaintCategory, string> = {
      'Water Supply': 'Water Supply & Sewerage Board',
      'Roads': 'Public Works Department (Roads & Bridges)',
      'Electricity': 'Electricity & Energy Authority',
      'Sanitation': 'Solid Waste Management & Sanitation',
      'Public Safety': 'Police & Public Safety Department',
      'Other': 'Municipal Public Grievance Cell',
    };

    const initialAssignedDepartment = departmentRouting[category as ComplaintCategory] || 'Municipal Public Grievance Cell';

    const complaintPriority: ComplaintPriority =
      priority && VALID_PRIORITIES.includes(priority as ComplaintPriority)
        ? (priority as ComplaintPriority)
        : 'Medium';

    const cleanAddress = location.address.trim();
    const cleanCity = location.city.trim();
    const cleanLandmark = location.landmark && typeof location.landmark === 'string' ? location.landmark.trim() : '';
    const cleanPincode = location.pincode && typeof location.pincode === 'string' ? location.pincode.trim() : '';

    const newComplaint = new Complaint({
      trackingId,
      citizenId: req.user ? req.user.userId : undefined,
      citizenName: fullName.trim(),
      citizenEmail: email.toLowerCase().trim(),
      citizenPhone: phone.trim(),
      category: category as ComplaintCategory,
      title: title.trim(),
      description: description.trim(),
      location: {
        address: cleanAddress,
        city: cleanCity,
        landmark: cleanLandmark,
        pincode: cleanPincode,
      },
      priority: complaintPriority,
      assignedDepartment: initialAssignedDepartment,
      status: 'Submitted',
      remarks: [],
      timeline: [
        {
          action: 'Complaint Registered',
          status: 'Submitted',
          performedBy: req.user ? `Citizen: ${req.user.name}` : `Citizen: ${fullName.trim()}`,
          note: `Grievance officially registered with tracking reference ${trackingId}. Routed to ${initialAssignedDepartment}.`,
          timestamp: new Date(),
        },
      ],
    });

    await newComplaint.save();

    res.status(201).json({
      success: true,
      message: 'Grievance submitted successfully. Keep your tracking reference safe!',
      trackingId: newComplaint.trackingId,
      complaint: newComplaint,
    });
  } catch (err: any) {
    console.error('Complaint submission error:', err);
    res.status(500).json({
      success: false,
      message: 'Server error occurred while submitting complaint.',
    });
  }
});

// GET /api/complaints/track/:trackingId - Public status tracker (Rate-limited & Privacy-Hardened)
complaintsRouter.get(
  '/track/:trackingId',
  trackingRateLimiter,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const rawId = req.params.trackingId ? req.params.trackingId.trim().toUpperCase() : '';

      if (!rawId || !/^CT-\d{4}-[A-Z0-9]+$/.test(rawId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid tracking ID format. Reference must follow CT-YYYY-XXXXX format.',
        });
        return;
      }

      const complaint = await Complaint.findOne({ trackingId: rawId });

      if (!complaint) {
        res.status(404).json({
          success: false,
          message: `No public grievance found matching reference "${rawId}".`,
        });
        return;
      }

      // PRIVACY HARDENING:
      // Strip all personal identifiers (citizen phone, email, full name, MongoDB user _id).
      // Only return necessary public tracking metrics.
      const sanitizedTimeline = complaint.timeline.map((item: ITimelineItem) => ({
        action: item.action,
        status: item.status,
        performedBy: item.performedBy.startsWith('Citizen:')
          ? 'Reporting Citizen'
          : item.performedBy,
        note: item.note,
        timestamp: item.timestamp,
      }));

      // Only expose official administrator remarks publicly; omit internal or private citizen remarks
      const publicRemarks = complaint.remarks
        .filter((r: IRemarkItem) => r.role === 'admin')
        .map((r: IRemarkItem) => ({
          author: r.author,
          role: r.role,
          comment: r.comment,
          timestamp: r.timestamp,
        }));

      res.status(200).json({
        success: true,
        complaint: {
          trackingId: complaint.trackingId,
          category: complaint.category,
          title: complaint.title,
          description: complaint.description,
          location: {
            address: complaint.location.address,
            city: complaint.location.city,
            landmark: complaint.location.landmark,
            pincode: complaint.location.pincode,
          },
          priority: complaint.priority,
          assignedDepartment: complaint.assignedDepartment,
          status: complaint.status,
          remarks: publicRemarks,
          timeline: sanitizedTimeline,
          resolutionNote: complaint.resolutionNote,
          rejectionReason: complaint.rejectionReason,
          createdAt: complaint.createdAt,
          updatedAt: complaint.updatedAt,
          resolvedAt: complaint.resolvedAt,
        },
      });
    } catch (err: any) {
      console.error('Tracking query error:', err);
      res.status(500).json({
        success: false,
        message: 'Error retrieving tracking information.',
      });
    }
  }
);

// GET /api/complaints - List complaints (Citizen gets ONLY own; Admin gets all with filters)
complaintsRouter.get('/', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const isUserAdmin = req.user?.role === 'admin';
    const query: any = {};

    if (!isUserAdmin) {
      // CITIZEN PRIVACY: Citizens can strictly only retrieve their own complaints
      query.$or = [
        { citizenId: req.user?.userId },
        { citizenEmail: req.user?.email.toLowerCase() },
      ];
    } else {
      // ADMIN: Can query all complaints with validated filters
      const { status, category, department, priority, search, startDate, endDate } = req.query;

      if (status && status !== 'All') {
        if (VALID_STATUSES.includes(status as ComplaintStatus)) {
          query.status = status;
        }
      }
      if (category && category !== 'All') {
        if (VALID_CATEGORIES.includes(category as ComplaintCategory)) {
          query.category = category;
        }
      }
      if (department && department !== 'All' && typeof department === 'string') {
        query.assignedDepartment = department;
      }
      if (priority && priority !== 'All') {
        if (VALID_PRIORITIES.includes(priority as ComplaintPriority)) {
          query.priority = priority;
        }
      }

      // Date Range Validation
      if (startDate || endDate) {
        query.createdAt = {};
        if (startDate && typeof startDate === 'string') {
          const parsedStart = new Date(startDate);
          if (!isNaN(parsedStart.getTime())) {
            query.createdAt.$gte = parsedStart;
          }
        }
        if (endDate && typeof endDate === 'string') {
          const parsedEnd = new Date(endDate);
          if (!isNaN(parsedEnd.getTime())) {
            parsedEnd.setHours(23, 59, 59, 999);
            query.createdAt.$lte = parsedEnd;
          }
        }
      }

      // Safe keyword search with regex escape
      if (search && typeof search === 'string' && search.trim().length > 0) {
        const safeSearch = escapeRegex(search.trim().slice(0, 80));
        query.$or = [
          { trackingId: { $regex: safeSearch, $options: 'i' } },
          { title: { $regex: safeSearch, $options: 'i' } },
          { citizenName: { $regex: safeSearch, $options: 'i' } },
          { citizenEmail: { $regex: safeSearch, $options: 'i' } },
          { 'location.address': { $regex: safeSearch, $options: 'i' } },
          { 'location.city': { $regex: safeSearch, $options: 'i' } },
        ];
      }
    }

    const complaints = await Complaint.find(query).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: complaints.length,
      complaints,
    });
  } catch (err: any) {
    console.error('Fetch complaints error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve complaints.',
    });
  }
});

// GET /api/complaints/:id - Single complaint by MongoDB ObjectId or Tracking ID
complaintsRouter.get('/:id', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const rawId = req.params.id;
    let complaint = null;

    if (rawId.startsWith('CT-')) {
      complaint = await Complaint.findOne({ trackingId: rawId.toUpperCase() });
    } else {
      if (!mongoose.Types.ObjectId.isValid(rawId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid complaint identifier format.',
        });
        return;
      }
      complaint = await Complaint.findById(rawId);
    }

    if (!complaint) {
      res.status(404).json({
        success: false,
        message: 'Grievance record not found.',
      });
      return;
    }

    // Role check: citizen can ONLY view their own complaint
    if (
      req.user?.role !== 'admin' &&
      complaint.citizenId?.toString() !== req.user?.userId &&
      complaint.citizenEmail.toLowerCase() !== req.user?.email.toLowerCase()
    ) {
      res.status(403).json({
        success: false,
        message: 'Forbidden. You do not have permission to view another citizen’s complaint.',
      });
      return;
    }

    res.status(200).json({
      success: true,
      complaint,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: 'Error fetching grievance record.',
    });
  }
});

// PATCH /api/complaints/:id/status - [Admin Only] Update complaint status
complaintsRouter.patch(
  '/:id/status',
  authenticateUser,
  requireAdmin,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { status, note, resolutionNote, rejectionReason } = req.body;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({
          success: false,
          message: 'Invalid complaint ID.',
        });
        return;
      }

      if (!status || !VALID_STATUSES.includes(status as ComplaintStatus)) {
        res.status(400).json({
          success: false,
          message: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`,
        });
        return;
      }

      const complaint = await Complaint.findById(id);
      if (!complaint) {
        res.status(404).json({
          success: false,
          message: 'Complaint record not found.',
        });
        return;
      }

      // Strict validation for Resolved status
      if (status === 'Resolved') {
        if (
          resolutionNote === undefined ||
          resolutionNote === null ||
          typeof resolutionNote !== 'string' ||
          resolutionNote.trim().length === 0
        ) {
          res.status(400).json({
            success: false,
            message: 'A mandatory resolution note is required when marking a complaint as Resolved. Please provide details of the resolution.',
          });
          return;
        }

        if (resolutionNote.trim().length < 5) {
          res.status(400).json({
            success: false,
            message: 'Resolution note must be at least 5 characters in length describing the work performed.',
          });
          return;
        }

        complaint.resolvedAt = new Date();
        complaint.resolutionNote = resolutionNote.trim();
        complaint.rejectionReason = '';
      } else if (status === 'Rejected') {
        // Strict validation for Rejected status
        if (
          rejectionReason === undefined ||
          rejectionReason === null ||
          typeof rejectionReason !== 'string' ||
          rejectionReason.trim().length === 0
        ) {
          res.status(400).json({
            success: false,
            message: 'A mandatory rejection reason is required when rejecting a complaint. Please provide the reason for closure.',
          });
          return;
        }

        if (rejectionReason.trim().length < 5) {
          res.status(400).json({
            success: false,
            message: 'Rejection reason must be at least 5 characters in length explaining why the grievance cannot be resolved.',
          });
          return;
        }

        complaint.rejectionReason = rejectionReason.trim();
        complaint.resolvedAt = undefined;
        complaint.resolutionNote = '';
      } else {
        // Status transitioning back to 'Submitted' or 'In Progress'
        // Clear previous resolution/rejection data so subsequent resolution requires a fresh note
        complaint.resolvedAt = undefined;
        complaint.resolutionNote = '';
        complaint.rejectionReason = '';
      }

      const previousStatus = complaint.status;
      complaint.status = status;

      // Add to timeline
      complaint.timeline.push({
        action: `Status Transition: ${previousStatus} → ${status}`,
        status,
        performedBy: `Administrator: ${req.user?.name}`,
        note:
          note && typeof note === 'string' && note.trim().length > 0
            ? note.trim()
            : status === 'Resolved'
            ? resolutionNote.trim()
            : status === 'Rejected'
            ? rejectionReason.trim()
            : `Status changed to ${status}`,
        timestamp: new Date(),
      });

      if (note && typeof note === 'string' && note.trim().length > 0) {
        complaint.remarks.push({
          author: req.user?.name || 'Administrator',
          role: 'admin',
          comment: note.trim(),
          timestamp: new Date(),
        });
      }

      await complaint.save();

      res.status(200).json({
        success: true,
        message: `Complaint status updated to ${status}.`,
        complaint,
      });
    } catch (err: any) {
      console.error('Update status error:', err);
      res.status(500).json({
        success: false,
        message: 'Failed to update complaint status.',
      });
    }
  }
);

// PATCH /api/complaints/:id/assign - [Admin Only] Assign department & priority
complaintsRouter.patch(
  '/:id/assign',
  authenticateUser,
  requireAdmin,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { department, priority, note } = req.body;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({
          success: false,
          message: 'Invalid complaint ID.',
        });
        return;
      }

      if (!department || typeof department !== 'string' || department.trim().length < 2) {
        res.status(400).json({
          success: false,
          message: 'A valid department name is required.',
        });
        return;
      }

      const complaint = await Complaint.findById(id);
      if (!complaint) {
        res.status(404).json({
          success: false,
          message: 'Complaint not found.',
        });
        return;
      }

      const previousDept = complaint.assignedDepartment;
      complaint.assignedDepartment = department.trim();

      if (priority && VALID_PRIORITIES.includes(priority as ComplaintPriority)) {
        complaint.priority = priority as ComplaintPriority;
      }

      if (complaint.status === 'Submitted') {
        complaint.status = 'In Progress';
      }

      complaint.timeline.push({
        action: 'Department Assignment',
        status: complaint.status,
        performedBy: `Administrator: ${req.user?.name}`,
        note:
          note && typeof note === 'string' && note.trim().length > 0
            ? note.trim()
            : `Assigned to ${department.trim()} (Priority: ${complaint.priority})`,
        timestamp: new Date(),
      });

      if (note && typeof note === 'string' && note.trim().length > 0) {
        complaint.remarks.push({
          author: req.user?.name || 'Administrator',
          role: 'admin',
          comment: `[Department Assignment] ${note.trim()}`,
          timestamp: new Date(),
        });
      }

      await complaint.save();

      res.status(200).json({
        success: true,
        message: `Assigned to ${department.trim()} successfully.`,
        complaint,
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to assign complaint.',
      });
    }
  }
);

// POST /api/complaints/:id/remarks - Add remark (Admin or Complaint Owner only)
complaintsRouter.post(
  '/:id/remarks',
  authenticateUser,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { comment } = req.body;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({
          success: false,
          message: 'Invalid complaint ID.',
        });
        return;
      }

      if (!comment || typeof comment !== 'string' || comment.trim().length < 2) {
        res.status(400).json({
          success: false,
          message: 'Remark text cannot be empty.',
        });
        return;
      }

      const complaint = await Complaint.findById(id);
      if (!complaint) {
        res.status(404).json({
          success: false,
          message: 'Complaint not found.',
        });
        return;
      }

      // Check authorization: only admin or the reporting citizen
      const isAdmin = req.user?.role === 'admin';
      const isOwner =
        complaint.citizenId?.toString() === req.user?.userId ||
        complaint.citizenEmail.toLowerCase() === req.user?.email.toLowerCase();

      if (!isAdmin && !isOwner) {
        res.status(403).json({
          success: false,
          message: 'Forbidden. You do not have permission to append remarks to this complaint.',
        });
        return;
      }

      const authorName = req.user?.name || (isAdmin ? 'Administrator' : 'Citizen');
      const authorRole = req.user?.role || 'citizen';

      complaint.remarks.push({
        author: authorName,
        role: authorRole,
        comment: comment.trim(),
        timestamp: new Date(),
      });

      complaint.timeline.push({
        action: `Remark Added by ${isAdmin ? 'Administrator' : 'Citizen'}`,
        status: complaint.status,
        performedBy: authorName,
        note: comment.trim(),
        timestamp: new Date(),
      });

      await complaint.save();

      res.status(200).json({
        success: true,
        message: 'Remark recorded in audit history.',
        complaint,
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to add remark.',
      });
    }
  }
);

// DELETE /api/complaints/:id - [Admin Only] Delete spam or duplicate complaint
complaintsRouter.delete(
  '/:id',
  authenticateUser,
  requireAdmin,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({
          success: false,
          message: 'Invalid complaint ID format.',
        });
        return;
      }

      const complaint = await Complaint.findByIdAndDelete(id);
      if (!complaint) {
        res.status(404).json({
          success: false,
          message: 'Complaint record not found.',
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: `Complaint ${complaint.trackingId} was deleted successfully.`,
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to delete complaint record.',
      });
    }
  }
);
