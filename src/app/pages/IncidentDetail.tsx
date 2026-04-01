import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router';
import { ArrowLeft, MapPin, Calendar, Clock, Sun, ShieldCheck, ShieldAlert, HelpCircle, Check, X, MessageSquare, Save, History, FileText, Camera, Maximize2 } from 'lucide-react';
import { showToast } from '@/app/utils/toast';
import { ConfirmDialog } from '@/app/components/ConfirmDialog';
import { ImageViewer, ImageViewerImage } from '@/app/components/ImageViewer';

export function IncidentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

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

  // Fetch incident from backend
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

  if (!incident) {
    return <div className="text-white p-6">Loading incident...</div>;
  }

  const detection = incident.detections?.[0];

  // Dynamic Evidence Images
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
    else if (decisionType === 'Reject') setConfirmAction('reject');
    else if (decisionType === 'Needs Info') setConfirmAction('needsInfo');

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/incidents" className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-white">Incident {id}</h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium border">
                {status}
              </span>
            </div>
            <p className="text-slate-400 text-sm mt-1">Reviewing potential violation detected by YOLO</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Evidence Column */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex justify-between items-center">
              <h3 className="font-semibold text-white flex items-center gap-2">
                <Camera className="w-4 h-4 text-blue-400" />
                Evidence Gallery
              </h3>
              <button
                onClick={() => handleOpenImageViewer(0)}
                className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm"
              >
                <Maximize2 className="w-4 h-4" />
                View Gallery
              </button>
            </div>

            <div
              className="relative aspect-video bg-black group cursor-pointer"
              onClick={() => handleOpenImageViewer(0)}
            >
              <img
                src={detection?.image_url}
                alt="Violation Evidence"
                className="w-full h-full object-cover"
              />

              <div className="absolute top-1/4 left-1/3 w-1/4 h-1/2 border-2 border-orange-500 bg-orange-500/10">
                <div className="absolute -top-7 left-0 bg-orange-500 text-white text-xs px-2 py-1 font-mono rounded-t-sm">
                  {detection?.type.replace("_", " ")}: {(detection?.confidence * 100).toFixed(1)}%
                </div>
              </div>

              <div className="absolute bottom-4 right-4 bg-black/70 px-3 py-1.5 rounded text-white text-xs font-mono">
                {new Date(incident.timestamp).toLocaleString()}
              </div>
            </div>

            <div className="p-4 bg-slate-950 grid grid-cols-4 gap-2">
              {evidenceImages.map((img, i) => (
                <button
                  key={i}
                  onClick={() => handleOpenImageViewer(i)}
                  className="aspect-video bg-slate-800 rounded overflow-hidden border-2"
                >
                  <img
                    src={img.src}
                    alt={img.alt}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Case History */}
          <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
            <h3 className="font-semibold text-white flex items-center gap-2 mb-4">
              <History className="w-4 h-4 text-slate-400" />
              Case History
            </h3>
            <p className="text-slate-400 text-sm">System created incident report.</p>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Detection Details */}
          <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
            <h3 className="font-semibold text-white mb-4">Detection Details</h3>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-slate-400 text-sm">Violation Type</span>
                <span className="text-orange-400 font-medium text-sm">
                  {detection?.type.replace("_", " ")}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-400 text-sm">Model Confidence</span>
                <span className="text-slate-200 font-mono text-sm">
                  {(detection?.confidence * 100).toFixed(1)}%
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-400 text-sm">Plate Number</span>
                <span className="text-white">
                  {detection?.plate_number || "N/A"}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-400 text-sm">Passenger Count</span>
                <span className="text-white">
                  {incident.context?.passenger_count || "N/A"}
                </span>
              </div>
            </div>
          </div>

          {/* Context */}
          <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
            <h3 className="font-semibold text-white mb-4">Context & Conditions</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <MapPin className="w-4 h-4" />
                <div className="text-sm">{incident.location}</div>
              </div>

              <div>
                <Clock className="w-4 h-4" />
                <div className="text-sm">
                  {new Date(incident.timestamp).toLocaleTimeString()}
                </div>
              </div>

              <div>
                <Sun className="w-4 h-4" />
                <div className="text-sm">
                  {incident.context?.weather || "Unknown"}
                </div>
              </div>

              <div>
                <FileText className="w-4 h-4" />
                <div className="text-sm">
                  {incident.context?.traffic || "Unknown"}
                </div>
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