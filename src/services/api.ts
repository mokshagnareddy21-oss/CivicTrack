import {
  IComplaint,
  IUser,
  AnalyticsData,
  PublicStats,
  ComplaintStatus,
  ComplaintPriority,
} from '../types.ts';

const TOKEN_KEY = 'civictrack_token';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function removeStoredToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

function getAuthHeaders(): HeadersInit {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export const api = {
  // Auth
  async register(data: {
    name: string;
    email: string;
    password: string;
    phone: string;
    address?: string;
    city?: string;
    role?: 'citizen' | 'admin';
  }): Promise<{ success: boolean; token: string; user: IUser; message?: string }> {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Registration failed');
    return json;
  },

  async login(credentials: {
    email: string;
    password: string;
  }): Promise<{ success: boolean; token: string; user: IUser; message?: string }> {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Login failed');
    return json;
  },

  async getMe(): Promise<{ success: boolean; user: IUser }> {
    const res = await fetch('/api/auth/me', {
      headers: getAuthHeaders(),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Failed to fetch user profile');
    return json;
  },

  async updateProfile(data: {
    name: string;
    phone: string;
    address?: string;
    city?: string;
  }): Promise<{ success: boolean; user: IUser; message?: string }> {
    const res = await fetch('/api/auth/profile', {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Failed to update profile');
    return json;
  },

  async changePassword(data: {
    currentPassword: string;
    newPassword: string;
  }): Promise<{ success: boolean; message: string }> {
    const res = await fetch('/api/auth/change-password', {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Failed to change password');
    return json;
  },

  // Complaints
  async submitComplaint(data: {
    fullName: string;
    email: string;
    phone: string;
    category: string;
    title: string;
    description: string;
    location: {
      address: string;
      city: string;
      landmark?: string;
      pincode?: string;
    };
    priority?: ComplaintPriority;
  }): Promise<{ success: boolean; trackingId: string; complaint: IComplaint; message: string }> {
    const res = await fetch('/api/complaints', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Complaint submission failed');
    return json;
  },

  async trackComplaint(trackingId: string): Promise<{ success: boolean; complaint: IComplaint }> {
    const res = await fetch(`/api/complaints/track/${encodeURIComponent(trackingId.trim())}`);
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Complaint not found');
    return json;
  },

  async getComplaints(filters?: {
    status?: string;
    category?: string;
    department?: string;
    priority?: string;
    search?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<{ success: boolean; count: number; complaints: IComplaint[] }> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, val]) => {
        if (val && val !== 'All') params.append(key, val);
      });
    }

    const res = await fetch(`/api/complaints?${params.toString()}`, {
      headers: getAuthHeaders(),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Failed to load complaints');
    return json;
  },

  async getComplaintById(id: string): Promise<{ success: boolean; complaint: IComplaint }> {
    const res = await fetch(`/api/complaints/${id}`, {
      headers: getAuthHeaders(),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Failed to load complaint details');
    return json;
  },

  async updateStatus(
    id: string,
    payload: {
      status: ComplaintStatus;
      note?: string;
      resolutionNote?: string;
      rejectionReason?: string;
    }
  ): Promise<{ success: boolean; complaint: IComplaint; message: string }> {
    const res = await fetch(`/api/complaints/${id}/status`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Failed to update status');
    return json;
  },

  async assignDepartment(
    id: string,
    payload: {
      department: string;
      priority?: ComplaintPriority;
      note?: string;
    }
  ): Promise<{ success: boolean; complaint: IComplaint; message: string }> {
    const res = await fetch(`/api/complaints/${id}/assign`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Failed to assign department');
    return json;
  },

  async addRemark(
    id: string,
    comment: string
  ): Promise<{ success: boolean; complaint: IComplaint; message: string }> {
    const res = await fetch(`/api/complaints/${id}/remarks`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ comment }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Failed to add remark');
    return json;
  },

  async deleteComplaint(id: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`/api/complaints/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Failed to delete complaint');
    return json;
  },

  // Analytics & Stats
  async getAnalytics(): Promise<AnalyticsData> {
    const res = await fetch('/api/analytics/overview', {
      headers: getAuthHeaders(),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Failed to fetch analytics');
    return json;
  },

  async getPublicStats(): Promise<PublicStats> {
    const res = await fetch('/api/analytics/public-stats');
    const json = await res.json();
    return json.stats;
  },

  async getHealth(): Promise<any> {
    const res = await fetch('/api/health');
    return await res.json();
  },

  async retryDbConnection(): Promise<any> {
    const res = await fetch('/api/health/retry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    return await res.json();
  },
};
