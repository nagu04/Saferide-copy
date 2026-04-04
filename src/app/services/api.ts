/**
 * API Service Layer for SafeRide Dashboard
 * 
 * This service handles all communication with the Python FastAPI backend.
 * 
 * BACKEND REQUIREMENTS:
 * ====================
 * Your Python FastAPI backend should implement these endpoints:
 * 
 * Authentication:
 *   POST   /api/auth/login
 *   POST   /api/auth/logout
 *   GET    /api/auth/me
 * 
 * Violations:
 *   GET    /api/violations              (with query params for filtering/pagination)
 *   GET    /api/violations/{id}
 *   POST   /api/violations/{id}/review
 *   
 * Dashboard:
 *   GET    /api/dashboard/stats
 *   GET    /api/dashboard/trends
 *   GET    /api/dashboard/recent
 * 
 * Analytics:
 *   GET    /api/analytics/metrics
 *   GET    /api/analytics/location-stats
 * 
 * Reports:
 *   POST   /api/reports/generate
 *   GET    /api/reports/{id}
 *   GET    /api/reports
 * 
 * Audit:
 *   GET    /api/audit/logs
 * 
 * Cameras:
 *   GET    /api/cameras
 *   GET    /api/cameras/{id}
 * 
 * WebSocket:
 *   WS     /ws/violations               (real-time updates)
 */

import type {
  LoginRequest,
  LoginResponse,
  User,
  Violation,
  ViolationListResponse,
  ViolationFilters,
  ReviewDecision,
  DashboardStats,
  ViolationTrendData,
  ModelMetrics,
  AuditLogResponse,
  ReportRequest,
  ReportData,
  Camera,
  LocationStats,
  APIError,
} from '@/app/types';

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
const WS_BASE_URL = import.meta.env.VITE_WS_BASE_URL || 'ws://localhost:8000';

// Mock mode flag - set to false when backend is ready
const USE_MOCK_DATA = import.meta.env.VITE_USE_MOCK_DATA !== 'false';

// ==================== Helper Functions ====================

/**
 * Get JWT token from localStorage
 */
function getAuthToken(): string | null {
  return localStorage.getItem('access_token');
}

/**
 * Set JWT token in localStorage
 */
function setAuthToken(token: string): void {
  localStorage.setItem('access_token', token);
}

/**
 * Remove JWT token from localStorage
 */
function clearAuthToken(): void {
  localStorage.removeItem('access_token');
}

/**
 * Get authenticated user from localStorage
 */
export function getCurrentUser(): User | null {
  const userJson = localStorage.getItem('current_user');
  return userJson ? JSON.parse(userJson) : null;
}

/**
 * Save authenticated user to localStorage
 */
function setCurrentUser(user: User): void {
  localStorage.setItem('current_user', JSON.stringify(user));
}

/**
 * Generic API request handler
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAuthToken();
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Backend error:", errorText);
      throw new Error(errorText || `HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('API Request Error:', error);
    throw error;
  }
}

// ==================== Authentication API ====================

export const authAPI = {
  /**
   * Login user
   * Backend: POST /api/auth/login
   */
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    if (USE_MOCK_DATA) {
      // Mock login
      await new Promise(resolve => setTimeout(resolve, 1000));
      const mockResponse: LoginResponse = {
        access_token: 'mock_jwt_token_' + Date.now(),
        token_type: 'bearer',
        user: {
          id: 'user-001',
          username: credentials.username,
          email: `${credentials.username}@saferide.gov.ph`,
          role: 'admin',
          full_name: 'Admin User',
          created_at: new Date().toISOString(),
          is_active: true,
        },
      };
      setAuthToken(mockResponse.access_token);
      setCurrentUser(mockResponse.user);
      return mockResponse;
    }

    const response = await apiRequest<LoginResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    setAuthToken(response.access_token);
    setCurrentUser(response.user);
    return response;
  },

  /**
   * Logout user
   * Backend: POST /api/auth/logout
   */
  async logout(): Promise<void> {
    if (USE_MOCK_DATA) {
      clearAuthToken();
      localStorage.removeItem('current_user');
      return;
    }

    await apiRequest('/api/auth/logout', { method: 'POST' });
    clearAuthToken();
    localStorage.removeItem('current_user');
  },

  /**
   * Get current user info
   * Backend: GET /api/auth/me
   */
  async getCurrentUser(): Promise<User> {
    if (USE_MOCK_DATA) {
      const storedUser = getCurrentUser();
      if (storedUser) return storedUser;
      throw new Error('Not authenticated');
    }

    return await apiRequest<User>('/api/auth/me');
  },
};

// ==================== Violations API ====================

export const violationsAPI = {
  /**
   * Get paginated violations list with filters
   * Backend: GET /api/violations?status=pending&page=1&page_size=20
   */
  async getViolations(filters?: ViolationFilters): Promise<ViolationListResponse> {
    if (USE_MOCK_DATA) {
      // Return mock data
      const { getMockViolations } = await import('./mockData');
      return getMockViolations(filters);
    }

    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
    }

    return await apiRequest<ViolationListResponse>(
      `/api/violations?${params.toString()}`
    );
  },

  /**
   * Get single violation detail
   * Backend: GET /api/violations/{id}
   */
  async getViolation(id: string): Promise<Violation> {
    if (USE_MOCK_DATA) {
      const { getMockViolationDetail } = await import('./mockData');
      return getMockViolationDetail(id);
    }

    return await apiRequest<Violation>(`/api/violations/${id}`);
  },

  /**
   * Submit review decision for violation
   * Backend: POST /api/violations/{id}/review
   */
  async reviewViolation(decision: ReviewDecision): Promise<Violation> {
    if (USE_MOCK_DATA) {
      await new Promise(resolve => setTimeout(resolve, 500));
      const { getMockViolationDetail } = await import('./mockData');
      const violation = await getMockViolationDetail(decision.violation_id);
      return {
        ...violation,
        status: decision.decision === 'approve' ? 'approved' : decision.decision === 'reject' ? 'rejected' : 'needs_info',
        reviewed_by: getCurrentUser()?.full_name || 'Admin User',
        reviewed_at: new Date().toISOString(),
        reviewer_notes: decision.reviewer_notes || null,
        rejection_reason: decision.rejection_reason || null,
      };
    }

    return await apiRequest<Violation>(
      `/api/violations/${decision.violation_id}/review`,
      {
        method: 'POST',
        body: JSON.stringify(decision),
      }
    );
  },
  async bulkDelete(ids: string[]): Promise<void> {
    if (USE_MOCK_DATA) {
      await new Promise(resolve => setTimeout(resolve, 500));
      return;
    }

    await apiRequest(
      '/api/violations/bulk-delete',
      {
        method: 'POST',
        body: JSON.stringify({ ids }),
      }
    );
  },

  bulkReview: async (ids: string[], action: string) => {
    await apiRequest("/api/violations/bulk-review", {
      method: "POST",
      body: JSON.stringify({ ids, action }),
    });
  },

};

// ==================== Dashboard API ====================

export const dashboardAPI = {
  /**
   * Get dashboard statistics
   * Backend: GET /api/dashboard/stats
   */
  async getStats(): Promise<DashboardStats> {
    if (USE_MOCK_DATA) {
      const { getMockDashboardStats } = await import('./mockData');
      return getMockDashboardStats();
    }

    return await apiRequest<DashboardStats>('/api/dashboard/stats');
  },

  /**
   * Get violation trends data
   * Backend: GET /api/dashboard/trends?hours=6
   */
  async getTrends(hours: number = 6): Promise<ViolationTrendData[]> {
    if (USE_MOCK_DATA) {
      const { getMockTrendData } = await import('./mockData');
      return getMockTrendData(hours);
    }

    return await apiRequest<ViolationTrendData[]>(
      `/api/dashboard/trends?hours=${hours}`
    );
  },

  /**
   * Get recent violations
   * Backend: GET /api/dashboard/recent?limit=10
   */
  async getRecentViolations(limit: number = 10): Promise<Violation[]> {
    if (USE_MOCK_DATA) {
      const { getMockRecentViolations } = await import('./mockData');
      return getMockRecentViolations(limit);
    }

    return await apiRequest<Violation[]>(
      `/api/dashboard/recent?limit=${limit}`
    );
  },
};

// ==================== Analytics API ====================

export const analyticsAPI = {
  /**
   * Get model performance metrics
   * Backend: GET /api/analytics/metrics
   */
  async getMetrics(): Promise<ModelMetrics> {
    if (USE_MOCK_DATA) {
      const { getMockModelMetrics } = await import('./mockData');
      return getMockModelMetrics();
    }

    return await apiRequest<ModelMetrics>('/api/analytics/metrics');
  },

  /**
   * Get location-based statistics
   * Backend: GET /api/analytics/location-stats
   */
  async getLocationStats(): Promise<LocationStats[]> {
    if (USE_MOCK_DATA) {
      const { getMockLocationStats } = await import('./mockData');
      return getMockLocationStats();
    }

    return await apiRequest<LocationStats[]>('/api/analytics/location-stats');
  },
};

// ==================== Reports API ====================

export const reportsAPI = {
  /**
   * Generate new report
   * Backend: POST /api/reports/generate
   */
  async generateReport(request: ReportRequest): Promise<ReportData> {
    if (USE_MOCK_DATA) {
      const { getMockReport } = await import('./mockData');
      return getMockReport(request);
    }

    return await apiRequest<ReportData>('/api/reports/generate', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  },

  /**
   * Get report by ID
   * Backend: GET /api/reports/{id}
   */
  async getReport(id: string): Promise<ReportData> {
    if (USE_MOCK_DATA) {
      throw new Error('Mock data not implemented for this endpoint');
    }

    return await apiRequest<ReportData>(`/api/reports/${id}`);
  },

  /**
   * List all reports
   * Backend: GET /api/reports
   */
  async listReports(): Promise<ReportData[]> {
    if (USE_MOCK_DATA) {
      const { getMockReportsList } = await import('./mockData');
      return getMockReportsList();
    }

    return await apiRequest<ReportData[]>('/api/reports');
  },
};

// ==================== Audit API ====================

export const auditAPI = {
  /**
   * Get audit logs
   * Backend: GET /api/audit/logs?page=1&page_size=50
   */
  async getLogs(page: number = 1, pageSize: number = 50): Promise<AuditLogResponse> {
    if (USE_MOCK_DATA) {
      const { getMockAuditLogs } = await import('./mockData');
      return getMockAuditLogs(page, pageSize);
    }

    return await apiRequest<AuditLogResponse>(
      `/api/audit/logs?page=${page}&page_size=${pageSize}`
    );
  },
};

// ==================== Camera API ====================

export const cameraAPI = {
  /**
   * Get all cameras
   * Backend: GET /api/cameras
   */
  async getCameras(): Promise<Camera[]> {
    if (USE_MOCK_DATA) {
      const { getMockCameras } = await import('./mockData');
      return getMockCameras();
    }

    return await apiRequest<Camera[]>('/api/cameras');
  },

  /**
   * Get single camera
   * Backend: GET /api/cameras/{id}
   */
  async getCamera(id: string): Promise<Camera> {
    if (USE_MOCK_DATA) {
      throw new Error('Mock data not implemented for this endpoint');
    }

    return await apiRequest<Camera>(`/api/cameras/${id}`);
  },
};



// Export all APIs as a single object
export const api = {
  auth: authAPI,
  violations: violationsAPI,
  dashboard: dashboardAPI,
  analytics: analyticsAPI,
  reports: reportsAPI,
  audit: auditAPI,
  camera: cameraAPI,
};

export default api;
