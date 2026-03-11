/**
 * Mock Data for Development/Testing
 * 
 * This file provides mock data that matches the expected Python backend responses.
 * Used when VITE_USE_MOCK_DATA=true (default for development)
 */

import type {
  Violation,
  ViolationListResponse,
  ViolationFilters,
  DashboardStats,
  ViolationTrendData,
  ModelMetrics,
  AuditLogResponse,
  AuditLogEntry,
  ReportRequest,
  ReportData,
  Camera,
  LocationStats,
} from '@/app/types';

// ==================== Mock Violations ====================

const MOCK_VIOLATIONS: Violation[] = [
  {
    id: 'VIO-2024-001',
    timestamp: '2024-02-25T14:32:05.124Z',
    location: 'Sucat Main Gate',
    camera_id: 'CAM-001',
    detections: [
      {
        type: 'no_helmet',
        confidence: 0.94,
        bounding_box: { x: 120, y: 80, width: 150, height: 200 },
      },
    ],
    plate_data: {
      plate_number: 'ABC 1234',
      ocr_confidence: 0.98,
      is_registered: true,
      is_expired: false,
      registration_expiry_date: '2024-12-31',
    },
    passenger_count: 1,
    weather_condition: 'sunny',
    traffic_level: 'moderate',
    image_urls: [
      'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1558980664-10e7170b5df9?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1449426468159-d96dbf08f19f?auto=format&fit=crop&q=80&w=1200',
    ],
    status: 'pending',
    suggested_fine: 1500,
    model_version: 'YOLOv11n-v1.0',
    fps: 24,
    reviewed_by: null,
    reviewed_at: null,
    reviewer_notes: null,
    rejection_reason: null,
  },
  {
    id: 'VIO-2024-002',
    timestamp: '2024-02-25T14:28:12.456Z',
    location: 'Buli Checkpoint',
    camera_id: 'CAM-002',
    detections: [
      {
        type: 'overloading',
        confidence: 0.88,
        bounding_box: { x: 100, y: 60, width: 200, height: 250 },
      },
    ],
    plate_data: {
      plate_number: 'XYZ 5678',
      ocr_confidence: 0.92,
      is_registered: true,
      is_expired: false,
      registration_expiry_date: '2025-03-15',
    },
    passenger_count: 3,
    weather_condition: 'cloudy',
    traffic_level: 'heavy',
    image_urls: [
      'https://images.unsplash.com/photo-1609630875171-b1321377ee65?auto=format&fit=crop&q=80&w=1200',
    ],
    status: 'approved',
    suggested_fine: 2000,
    model_version: 'YOLOv11n-v1.0',
    fps: 24,
    reviewed_by: 'Admin User',
    reviewed_at: '2024-02-25T14:35:00.000Z',
    reviewer_notes: 'Clear violation - 3 passengers visible',
    rejection_reason: null,
  },
  {
    id: 'VIO-2024-003',
    timestamp: '2024-02-25T14:15:45.789Z',
    location: 'Cupang Junction',
    camera_id: 'CAM-003',
    detections: [
      {
        type: 'no_plate',
        confidence: 0.91,
      },
    ],
    plate_data: null,
    passenger_count: 1,
    weather_condition: 'rainy',
    traffic_level: 'light',
    image_urls: [
      'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&q=80&w=1200',
    ],
    status: 'rejected',
    suggested_fine: 5000,
    model_version: 'YOLOv11n-v1.0',
    fps: 24,
    reviewed_by: 'Reviewer Jane',
    reviewed_at: '2024-02-25T14:20:00.000Z',
    reviewer_notes: null,
    rejection_reason: 'Plate obscured by rain - unclear image',
  },
  {
    id: 'VIO-2024-004',
    timestamp: '2024-02-25T14:10:22.123Z',
    location: 'Sucat Main Gate',
    camera_id: 'CAM-001',
    detections: [
      {
        type: 'no_helmet',
        confidence: 0.97,
        bounding_box: { x: 140, y: 90, width: 160, height: 210 },
      },
    ],
    plate_data: {
      plate_number: 'DEF 9012',
      ocr_confidence: 0.95,
      is_registered: true,
      is_expired: true,
      registration_expiry_date: '2023-11-30',
    },
    passenger_count: 2,
    weather_condition: 'sunny',
    traffic_level: 'moderate',
    image_urls: [
      'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&q=80&w=1200',
    ],
    status: 'needs_info',
    suggested_fine: 1500,
    model_version: 'YOLOv11n-v1.0',
    fps: 24,
    reviewed_by: null,
    reviewed_at: null,
    reviewer_notes: null,
    rejection_reason: null,
  },
  {
    id: 'VIO-2024-005',
    timestamp: '2024-02-25T13:55:30.456Z',
    location: 'Buli Checkpoint',
    camera_id: 'CAM-002',
    detections: [
      {
        type: 'no_helmet',
        confidence: 0.92,
        bounding_box: { x: 130, y: 75, width: 145, height: 195 },
      },
    ],
    plate_data: {
      plate_number: 'GHI 3456',
      ocr_confidence: 0.89,
      is_registered: true,
      is_expired: false,
      registration_expiry_date: '2025-06-20',
    },
    passenger_count: 1,
    weather_condition: 'sunny',
    traffic_level: 'light',
    image_urls: [
      'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&q=80&w=1200',
    ],
    status: 'pending',
    suggested_fine: 1500,
    model_version: 'YOLOv11n-v1.0',
    fps: 24,
    reviewed_by: null,
    reviewed_at: null,
    reviewer_notes: null,
    rejection_reason: null,
  },
];

export function getMockViolations(filters?: ViolationFilters): ViolationListResponse {
  let filtered = [...MOCK_VIOLATIONS];

  if (filters) {
    if (filters.status) {
      filtered = filtered.filter(v => v.status === filters.status);
    }
    if (filters.violation_type) {
      filtered = filtered.filter(v => 
        v.detections.some(d => d.type === filters.violation_type)
      );
    }
    if (filters.location) {
      filtered = filtered.filter(v => 
        v.location.toLowerCase().includes(filters.location!.toLowerCase())
      );
    }
    if (filters.search_query) {
      filtered = filtered.filter(v =>
        v.id.toLowerCase().includes(filters.search_query!.toLowerCase()) ||
        v.plate_data?.plate_number?.toLowerCase().includes(filters.search_query!.toLowerCase())
      );
    }
  }

  const page = filters?.page || 1;
  const pageSize = filters?.page_size || 20;
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  const paginated = filtered.slice(start, end);

  return {
    violations: paginated,
    total: filtered.length,
    page,
    page_size: pageSize,
    total_pages: Math.ceil(filtered.length / pageSize),
  };
}

export function getMockViolationDetail(id: string): Violation {
  const violation = MOCK_VIOLATIONS.find(v => v.id === id);
  if (!violation) {
    throw new Error(`Violation ${id} not found`);
  }
  return violation;
}

// ==================== Mock Dashboard Data ====================

export function getMockDashboardStats(): DashboardStats {
  return {
    total_violations_today: 44,
    helmet_violations: 24,
    plate_violations: 12,
    overloading_violations: 8,
    pending_review_count: 15,
    approved_count: 22,
    rejected_count: 7,
    active_cameras: 4,
    total_cameras: 4,
    average_confidence: 0.923,
  };
}

export function getMockTrendData(hours: number): ViolationTrendData[] {
  const data: ViolationTrendData[] = [];
  const now = new Date();
  
  for (let i = hours; i >= 0; i--) {
    const time = new Date(now.getTime() - i * 60 * 60 * 1000);
    data.push({
      timestamp: time.toISOString(),
      helmet_count: Math.floor(Math.random() * 12) + 3,
      plate_count: Math.floor(Math.random() * 6) + 1,
      overload_count: Math.floor(Math.random() * 4),
    });
  }
  
  return data;
}

export function getMockRecentViolations(limit: number): Violation[] {
  return MOCK_VIOLATIONS.slice(0, limit);
}

// ==================== Mock Analytics Data ====================

export function getMockModelMetrics(): ModelMetrics {
  return {
    model_version: 'YOLOv11n-v1.0',
    total_detections: 1247,
    accuracy_rate: 0.94,
    precision: 0.92,
    recall: 0.89,
    f1_score: 0.905,
    average_inference_time_ms: 23.4,
    false_positive_rate: 0.08,
    false_negative_rate: 0.11,
    detections_by_type: {
      no_helmet: 645,
      no_plate: 412,
      overloading: 190,
    },
    confidence_distribution: [
      { range: '0.90-1.00', count: 892 },
      { range: '0.80-0.89', count: 245 },
      { range: '0.70-0.79', count: 78 },
      { range: '0.60-0.69', count: 32 },
    ],
  };
}

export function getMockLocationStats(): LocationStats[] {
  return [
    {
      location: 'Sucat Main Gate',
      camera_id: 'CAM-001',
      violation_count: 342,
      average_confidence: 0.93,
    },
    {
      location: 'Buli Checkpoint',
      camera_id: 'CAM-002',
      violation_count: 289,
      average_confidence: 0.91,
    },
    {
      location: 'Cupang Junction',
      camera_id: 'CAM-003',
      violation_count: 201,
      average_confidence: 0.88,
    },
    {
      location: 'Highway Patrol',
      camera_id: 'CAM-004',
      violation_count: 156,
      average_confidence: 0.95,
    },
  ];
}

// ==================== Mock Audit Logs ====================

export function getMockAuditLogs(page: number, pageSize: number): AuditLogResponse {
  const logs: AuditLogEntry[] = [
    {
      id: 'LOG-001',
      timestamp: '2024-02-25T14:35:12.456Z',
      user_id: 'user-001',
      user_name: 'Admin User',
      action: 'APPROVE_VIOLATION',
      entity_type: 'violation',
      entity_id: 'VIO-2024-002',
      details: {
        previous_status: 'pending',
        new_status: 'approved',
        notes: 'Clear violation - 3 passengers visible',
      },
      ip_address: '192.168.1.100',
      user_agent: 'Mozilla/5.0...',
    },
    {
      id: 'LOG-002',
      timestamp: '2024-02-25T14:20:05.789Z',
      user_id: 'user-002',
      user_name: 'Reviewer Jane',
      action: 'REJECT_VIOLATION',
      entity_type: 'violation',
      entity_id: 'VIO-2024-003',
      details: {
        previous_status: 'pending',
        new_status: 'rejected',
        rejection_reason: 'Plate obscured by rain - unclear image',
      },
      ip_address: '192.168.1.101',
      user_agent: 'Mozilla/5.0...',
    },
    {
      id: 'LOG-003',
      timestamp: '2024-02-25T14:00:30.123Z',
      user_id: 'user-001',
      user_name: 'Admin User',
      action: 'LOGIN',
      entity_type: 'user',
      entity_id: 'user-001',
      details: {
        login_method: 'password',
      },
      ip_address: '192.168.1.100',
      user_agent: 'Mozilla/5.0...',
    },
  ];

  const start = (page - 1) * pageSize;
  const end = start + pageSize;

  return {
    logs: logs.slice(start, end),
    total: logs.length,
    page,
    page_size: pageSize,
  };
}

// ==================== Mock Reports ====================

export function getMockReport(request: ReportRequest): ReportData {
  return {
    id: `RPT-${Date.now()}`,
    generated_at: new Date().toISOString(),
    generated_by: 'Admin User',
    report_type: request.report_type,
    period: {
      start: request.date_from,
      end: request.date_to,
    },
    summary: {
      total_violations: 44,
      by_type: {
        no_helmet: 24,
        no_plate: 12,
        overloading: 8,
        expired_registration: 0,
      },
      by_status: {
        pending: 15,
        approved: 22,
        rejected: 7,
        needs_info: 0,
      },
      by_location: {
        'Sucat Main Gate': 18,
        'Buli Checkpoint': 14,
        'Cupang Junction': 8,
        'Highway Patrol': 4,
      },
    },
    download_url: '/api/reports/download/RPT-' + Date.now(),
  };
}

export function getMockReportsList(): ReportData[] {
  return [
    {
      id: 'RPT-001',
      generated_at: '2024-02-25T10:00:00.000Z',
      generated_by: 'Admin User',
      report_type: 'daily',
      period: {
        start: '2024-02-25T00:00:00.000Z',
        end: '2024-02-25T23:59:59.999Z',
      },
      summary: {
        total_violations: 44,
        by_type: {
          no_helmet: 24,
          no_plate: 12,
          overloading: 8,
          expired_registration: 0,
        },
        by_status: {
          pending: 15,
          approved: 22,
          rejected: 7,
          needs_info: 0,
        },
        by_location: {
          'Sucat Main Gate': 18,
          'Buli Checkpoint': 14,
          'Cupang Junction': 8,
          'Highway Patrol': 4,
        },
      },
      download_url: '/api/reports/download/RPT-001',
    },
  ];
}

// ==================== Mock Cameras ====================

export function getMockCameras(): Camera[] {
  return [
    {
      id: 'CAM-001',
      name: 'Sucat Main Gate',
      location: 'Sucat Main Gate',
      status: 'online',
      stream_url: 'rtsp://localhost:8554/cam1',
      last_heartbeat: new Date().toISOString(),
      fps: 24,
      resolution: '1920x1080',
    },
    {
      id: 'CAM-002',
      name: 'Buli Checkpoint',
      location: 'Buli Checkpoint',
      status: 'online',
      stream_url: 'rtsp://localhost:8554/cam2',
      last_heartbeat: new Date().toISOString(),
      fps: 24,
      resolution: '1920x1080',
    },
    {
      id: 'CAM-003',
      name: 'Cupang Junction',
      location: 'Cupang Junction',
      status: 'online',
      stream_url: 'rtsp://localhost:8554/cam3',
      last_heartbeat: new Date().toISOString(),
      fps: 24,
      resolution: '1920x1080',
    },
    {
      id: 'CAM-004',
      name: 'Highway Patrol',
      location: 'Highway Patrol',
      status: 'online',
      stream_url: 'rtsp://localhost:8554/cam4',
      last_heartbeat: new Date().toISOString(),
      fps: 24,
      resolution: '1920x1080',
    },
  ];
}
