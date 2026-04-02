import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router';
import {
  ArrowLeft, MapPin, Clock, Sun, Check, X, HelpCircle,
  History, FileText, Camera, Maximize2
} from 'lucide-react';
import { showToast } from '@/app/utils/toast';
import { ConfirmDialog } from '@/app/components/ConfirmDialog';
import { ImageViewer, ImageViewerImage } from '@/app/components/ImageViewer';

export function IncidentDetail() {
  const { id } = useParams();

  const [incident, setIncident] = useState<any>(null);
  const [status, setStatus] = useState('Pending');
  const [reviewerNote, setReviewerNote] = useState('');
  const [showDecisionModal, setShowDecisionModal] = useState(false);
  const [decisionType, setDecisionType] = useState<'Approve' | 'Reject' | 'Needs Info' | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'approve' | 'reject' | 'needsInfo' | 'reopen' | null>(null);
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // Fetch incident from backend on mount
  useEffect(() => {
    if (!id) return;

    fetch(`https://saferide-l724.onrender.com/api/violations/${id}`)
      .then(res => res.json())
      .then(data => {
        setIncident(data);
        setStatus(
          data.status
            ? data.status.charAt(0).toUpperCase() + data.status.slice(1)
            : 'Pending'
        );
      })
      .catch(err => console.error(err));
  }, [id]);

  // Real-time WebSocket subscription
  useEffect(() => {
    if (!id) return;

    let ws: WebSocket | null = null;
    let reconnectInterval: any;
    let pingInterval: any;

    const connectWebSocket = () => {
      ws = new WebSocket('wss://saferide-l724.onrender.com/ws/violations');

      

      ws.onopen = () => {
        console.log('WebSocket connected');

        pingInterval = setInterval(() => {
          if (ws?.readyState === WebSocket.OPEN) {
            ws.send('ping');
          }
        }, 20000);
      };

      ws.onmessage = (event) => {
        const message = JSON.parse(event.data);

        if (message.type === 'new_violation' && message.data.id === id) {
          setIncident(message.data);
          showToast.info(`New detection for incident ${id}`);

          setStatus(
            message.data.status
              ? message.data.status.charAt(0).toUpperCase() + message.data.status.slice(1)
              : 'Pending'
          );
        }
      };

      ws.onclose = () => {
        console.log('WebSocket closed, reconnecting...');
        clearInterval(pingInterval);
        reconnectInterval = setTimeout(connectWebSocket, 3000);
      };

      ws.onerror = (err) => {
        console.error('WebSocket error', err);
        ws?.close();
      };
    };

    connectWebSocket();

    return () => {
      ws?.close();
      clearTimeout(reconnectInterval);
      clearInterval(pingInterval);
    };
  }, [id]);

  if (!incident) {
    return <div className="text-white p-6">Loading incident...</div>;
  }

  // Dynamic evidence images
  const evidenceImages: ImageViewerImage[] =
    incident?.detections?.map((det: any) => ({
      src: det.image_url,
      alt: det.type,
      caption: `${det.type.replace("_", " ")} (${(det.confidence * 100).toFixed(1)}%)`,
      metadata: {
        timestamp: incident.timestamp,
        camera: incident.camera_id,
        confidence: det.confidence * 100
      }
    })) || [];

  const handleOpenImageViewer = (index: number) => {
    setSelectedImageIndex(index);
    setShowImageViewer(true);
  };

  const handleDecision = (type: 'Approve' | 'Reject' | 'Needs Info') => {
    setDecisionType(type);
    setShowDecisionModal(true);
  };

  const handleConfirmDecision = () => {
    setShowDecisionModal(false);

    if (decisionType === 'Approve') setConfirmAction('approve');
    if (decisionType === 'Reject') setConfirmAction('reject');
    if (decisionType === 'Needs Info') setConfirmAction('needsInfo');

    setShowConfirmDialog(true);
  };

  const handleReopen = () => {
    setConfirmAction('reopen');
    setShowConfirmDialog(true);
  };

  const executeAction = async () => {
    setIsProcessing(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const incidentId = id || 'INC-001';

      if (confirmAction === 'approve') {
        setStatus('Approved');
        showToast.incidentApproved(incidentId);
      }

      if (confirmAction === 'reject') {
        setStatus('Rejected');
        showToast.incidentRejected(incidentId, reviewerNote || undefined);
      }

      if (confirmAction === 'needsInfo') {
        setStatus('Needs Info');
        showToast.info('Additional Information Requested');
      }

      if (confirmAction === 'reopen') {
        setStatus('Pending');
        showToast.info('Case Reopened');
      }

      setShowConfirmDialog(false);
      setConfirmAction(null);
      setReviewerNote('');
    } catch (error) {
      showToast.error('Action Failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const detection = incident.detections?.[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/incidents" className="p-2 hover:bg-slate-800 rounded-lg">
          <ArrowLeft className="w-5 h-5 text-slate-400" />
        </Link>

        <div>
          <h1 className="text-2xl font-bold text-white">Incident {id}</h1>
          <p className="text-slate-400 text-sm">
            Reviewing violation detected by AI
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Evidence */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex justify-between">
              <h3 className="text-white flex items-center gap-2">
                <Camera className="w-4 h-4 text-blue-400" />
                Evidence Gallery
              </h3>
              <button
                onClick={() => handleOpenImageViewer(0)}
                className="px-3 py-1.5 bg-blue-600 rounded-lg text-sm"
              >
                <Maximize2 className="w-4 h-4 inline" /> View
              </button>
            </div>

            <div
              className="relative aspect-video bg-black cursor-pointer"
              onClick={() => handleOpenImageViewer(0)}
            >
              <img
                src={detection?.image_url}
                alt="Violation Evidence"
                className="w-full h-full object-cover"
              />

              {/* Bounding box label */}
              <div className="absolute top-4 left-4 bg-orange-500 text-white text-xs px-2 py-1 rounded">
                {detection?.type.replace("_", " ")}: {(detection?.confidence * 100).toFixed(1)}%
              </div>

              {/* Timestamp */}
              <div className="absolute bottom-4 right-4 bg-black/70 px-3 py-1 text-xs text-white">
                {new Date(incident.timestamp).toLocaleString()}
              </div>
            </div>

            {/* Thumbnails */}
            <div className="p-4 bg-slate-950 grid grid-cols-4 gap-2">
              {evidenceImages.map((img, i) => (
                <button
                  key={i}
                  onClick={() => handleOpenImageViewer(i)}
                  className="aspect-video bg-slate-800 rounded overflow-hidden"
                >
                  <img src={img.src} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Detection Details */}
          <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
            <h3 className="text-white mb-4">Detection Details</h3>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Violation</span>
                <span className="text-orange-400">
                  {detection?.type.replace("_", " ")}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-400">Confidence</span>
                <span>{(detection?.confidence * 100).toFixed(1)}%</span>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-400">Plate</span>
                <span>{detection?.plate_number || "N/A"}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-400">Passengers</span>
                <span>{incident.context?.passenger_count || "N/A"}</span>
              </div>
            </div>
          </div>

          {/* Context */}
          <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
            <h3 className="text-white mb-4">Context</h3>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <MapPin className="w-4 h-4 inline" />
                <div>{incident.location}</div>
              </div>

              <div>
                <Clock className="w-4 h-4 inline" />
                <div>{new Date(incident.timestamp).toLocaleTimeString()}</div>
              </div>

              <div>
                <Sun className="w-4 h-4 inline" />
                <div>{incident.context?.weather || "Unknown"}</div>
              </div>

              <div>
                <FileText className="w-4 h-4 inline" />
                <div>{incident.context?.traffic || "Unknown"}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Image Viewer */}
      {showImageViewer && (
        <ImageViewer
          open={showImageViewer}
          onClose={() => setShowImageViewer(false)}
          images={evidenceImages}
          initialIndex={selectedImageIndex}
        />
      )}

      {/* Confirm Dialog */}
      {showConfirmDialog && (
        <ConfirmDialog
          open={showConfirmDialog}
          onOpenChange={setShowConfirmDialog}
          onConfirm={executeAction}
          title="Confirm Action"
          description="Are you sure?"
          confirmText="Confirm"
          loading={isProcessing}
        />
      )}
    </div>
  );
}