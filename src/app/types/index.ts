/**
 * TypeScript Type Definitions for SafeRide Dashboard
 * 
 * These types match the expected Python FastAPI backend data models.
 * Ensure your Python Pydantic models align with these structures.
 */

// ==================== User & Authentication ====================

export interface User {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'reviewer' | 'viewer';
  full_name: string;
  created_at: string;
  is_active: boolean;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: User;
}

// ==================== Violations ====================

export type ViolationType = 'no_helmet' | 'no_plate' | 'overloading' | 'expired_registration';
export type ViolationStatus = 'pending' | 'approved' | 'rejected' | 'needs_info';
export type WeatherCondition = 'sunny' | 'cloudy' | 'rainy' | 'foggy';

export interface ViolationDetection {
  type: ViolationType;
  confidence: number;
  bounding_box?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface PlateData {
  plate_number: string | null;
  ocr_confidence: number;
  is_registered: boolean;
  is_expired: boolean;
  registration_expiry_date: string | null;
}

export interface Violation {
  id: string;
  timestamp: string;
  location: string;
  camera_id: string;
  detections: ViolationDetection[];
  plate_data: PlateData | null;
  passenger_count: number;
  weather_condition: WeatherCondition;
  traffic_level: 'light' | 'moderate' | 'heavy';
  image_urls: string[];
  status: ViolationStatus;
  suggested_fine: number;
  model_version: string;
  fps: number;
  reviewed_by: string | null;
  reviewed_at: string | null;
  reviewer_notes: string | null;
  rejection_reason: string | null;
}

export interface ViolationListResponse {
  violations: Violation[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface ViolationFilters {
  status?: ViolationStatus;
  violation_type?: ViolationType;
  location?: string;
  date_from?: string;
  date_to?: string;
  search_query?: string;
  page?: number;
  page_size?: number;
}

// ==================== Review Actions ====================

export interface ReviewDecision {
  violation_id: string;
  decision: 'approve' | 'reject' | 'needs_info';
  reviewer_notes?: string;
  rejection_reason?: string;
}

// ==================== Analytics & Metrics ====================

export interface DashboardStats {
  total_violations_today: number;
  helmet_violations: number;
  plate_violations: number;
  overloading_violations: number;
  pending_review_count: number;
  approved_count: number;
  rejected_count: number;
  active_cameras: number;
  total_cameras: number;
  average_confidence: number;
}

export interface ViolationTrendData {
  timestamp: string;
  helmet_count: number;
  plate_count: number;
  overload_count: number;
}

export interface LocationStats {
  location: string;
  camera_id: string;
  violation_count: number;
  average_confidence: number;
}

export interface ModelMetrics {
  model_version: string;
  total_detections: number;
  accuracy_rate: number;
  precision: number;
  recall: number;
  f1_score: number;
  average_inference_time_ms: number;
  false_positive_rate: number;
  false_negative_rate: number;
  detections_by_type: {
    no_helmet: number;
    no_plate: number;
    overloading: number;
  };
  confidence_distribution: {
    range: string;
    count: number;
  }[];
}

// ==================== Audit Log ====================

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  user_id: string;
  user_name: string;
  action: string;
  entity_type: 'violation' | 'user' | 'system';
  entity_id: string;
  details: Record<string, any>;
  ip_address: string;
  user_agent: string;
}

export interface AuditLogResponse {
  logs: AuditLogEntry[];
  total: number;
  page: number;
  page_size: number;
}

// ==================== Reports ====================

export interface ReportRequest {
  report_type: 'daily' | 'weekly' | 'monthly' | 'custom';
  date_from: string;
  date_to: string;
  include_images: boolean;
  violation_types?: ViolationType[];
  locations?: string[];
}

export interface ReportData {
  id: string;
  generated_at: string;
  generated_by: string;
  report_type: string;
  period: {
    start: string;
    end: string;
  };
  summary: {
    total_violations: number;
    by_type: Record<ViolationType, number>;
    by_status: Record<ViolationStatus, number>;
    by_location: Record<string, number>;
  };
  download_url: string;
}

// ==================== Camera Management ====================

export interface Camera {
  id: string;
  name: string;
  location: string;
  status: 'online' | 'offline' | 'maintenance';
  stream_url: string;
  last_heartbeat: string;
  fps: number;
  resolution: string;
}

// ==================== WebSocket Messages ====================

export interface WebSocketMessage {
  type: 'new_violation' | 'violation_updated' | 'camera_status' | 'system_alert';
  timestamp: string;
  data: any;
}



export interface NewViolationMessage extends WebSocketMessage {
  type: 'new_violation';
  data: Violation;
}

export interface ViolationUpdatedMessage extends WebSocketMessage {
  type: 'violation_updated';
  data: {
    violation_id: string;
    status: ViolationStatus;
    reviewed_by: string;
  };
}

// ==================== Error Handling ====================

export interface APIError {
  detail: string;
  status_code: number;
  error_code?: string;
}
