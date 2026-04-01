import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router';
import { ArrowLeft, MapPin, Calendar, Clock, Sun, ShieldCheck, ShieldAlert, HelpCircle, Check, X, MessageSquare, Save, History, FileText, Camera, Maximize2 } from 'lucide-react';
import { showToast } from '@/app/utils/toast';
import { ConfirmDialog } from '@/app/components/ConfirmDialog';
import { ImageViewer, ImageViewerImage } from '@/app/components/ImageViewer';

export function IncidentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('Pending');
  const [reviewerNote, setReviewerNote] = useState('');
  const [showDecisionModal, setShowDecisionModal] = useState(false);
  const [decisionType, setDecisionType] = useState<'Approve' | 'Reject' | 'Needs Info' | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'approve' | 'reject' | 'needsInfo' | 'reopen' | null>(null);
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [incident, setIncident] = useState<any>(null);

  useEffect(() => {
    if (!id) return;

    fetch(`https://saferide-l724.onrender.com/api/violations/${id}`)
      .then(res => res.json())
      .then(data => {
        setIncident(data);
        setStatus(data.status ? data.status.charAt(0).toUpperCase() + data.status.slice(1) : 'Pending');
      })
      .catch(err => console.error(err));
  }, [id]);

  // Evidence images data
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
      // Close the decision modal and open confirmation dialog
      setShowDecisionModal(false);
      
      if (decisionType === 'Approve') {
        setConfirmAction('approve');
      } else if (decisionType === 'Reject') {
        setConfirmAction('reject');
      } else if (decisionType === 'Needs Info') {
        setConfirmAction('needsInfo');
      }
      
      setShowConfirmDialog(true);
    };

    const handleReopen = () => {
      setConfirmAction('reopen');
      setShowConfirmDialog(true);
    };

    const executeAction = async () => {
    setIsProcessing(true);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500)); // keep short

      const incidentId = id || 'INC-2023-001';

      switch (confirmAction) {
        case 'approve':
          setStatus('Approved');
          showToast.incidentApproved(incidentId);
          showToast.info('Audit Log Updated', 'Incident approval has been logged.');
          break;
        case 'reject':
          setStatus('Rejected');
          showToast.incidentRejected(incidentId, reviewerNote || undefined);
          break;
        case 'needsInfo':
          setStatus('Needs Info');
          showToast.info('Additional Information Requested', `Incident ${incidentId} marked for additional review.`);
          break;
        case 'reopen':
          setStatus('Pending');
          showToast.info('Case Reopened', `Incident ${incidentId} has been reopened.`);
          break;
        default:
          break;
      }

      setShowConfirmDialog(false);
      setConfirmAction(null);
      setReviewerNote('');
    } catch (error) {
      showToast.error('Action Failed', 'Unable to process incident decision. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!incident) {
    return <div className="text-white p-6">Loading incident...</div>;
  }
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
              <h1 className="text-2xl font-bold text-white">Incident {id || 'INC-2023-001'}</h1>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                 status === 'Approved' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                 status === 'Rejected' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                 status === 'Needs Info' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                 'bg-slate-500/10 text-slate-400 border-slate-500/20'
              }`}>
                {status}
              </span>
            </div>
            <p className="text-slate-400 text-sm mt-1">Reviewing potential violation detected by YOLOv11</p>
          </div>
        </div>
        
        <div className="flex gap-2">
          {status === 'Pending' && (
            <>
              <button 
                onClick={() => handleDecision('Approve')}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium"
              >
                <Check className="w-4 h-4" /> Approve
              </button>
              <button 
                onClick={() => handleDecision('Reject')}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium"
              >
                <X className="w-4 h-4" /> Reject
              </button>
              <button 
                onClick={() => handleDecision('Needs Info')}
                className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors font-medium"
              >
                <HelpCircle className="w-4 h-4" /> Needs Info
              </button>
            </>
          )}
          {status !== 'Pending' && (
             <button 
                onClick={() => handleReopen()}
                className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors font-medium"
              >
                <History className="w-4 h-4" /> Re-open Case
              </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Evidence Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Evidence Gallery */}
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
                 src={incident?.detections?.[0]?.image_url}
                 alt="Violation Evidence"
                 className="w-full h-full object-cover"
               />
               
               {/* Zoom Overlay Hint */}
               <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center">
                 <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium">
                   <Maximize2 className="w-4 h-4" />
                   Click to zoom and view details
                 </div>
               </div>
               
               {/* Bounding Box Overlay */}
               <div className="absolute top-1/4 left-1/3 w-1/4 h-1/2 border-2 border-orange-500 bg-orange-500/10">
                 <div className="absolute -top-7 left-0 bg-orange-500 text-white text-xs px-2 py-1 font-mono rounded-t-sm">
                   {incident?.detections?.[0]?.type?.replace("_", " ")}: {incident?.detections?.[0]?.confidence ? (incident.detections[0].confidence * 100).toFixed(1) : '0'}%
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
                   className={`aspect-video bg-slate-800 rounded overflow-hidden border-2 transition-all ${
                     i === 0 ? 'border-blue-500 ring-2 ring-blue-500/50' : 'border-transparent hover:border-slate-600'
                   }`}
                 >
                   <img 
                     src={img.src} 
                     alt={img.alt}
                     className="w-full h-full object-cover opacity-80 hover:opacity-100 transition-opacity"
                   />
                 </button>
               ))}
            </div>
          </div>

          {/* Audit Log (Simulated) */}
          <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
             <h3 className="font-semibold text-white flex items-center gap-2 mb-4">
                <History className="w-4 h-4 text-slate-400" />
                Case History
             </h3>
             <div className="space-y-4">
                <div className="flex gap-4">
                   <div className="mt-1">
                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                      <div className="w-0.5 h-full bg-slate-800 mx-auto mt-1" />
                   </div>
                   <div>
                      <p className="text-sm text-slate-200"><span className="font-bold">System</span> created incident report.</p>
                      <p className="text-xs text-slate-500">Oct 25, 2023 at 14:32:05</p>
                   </div>
                </div>
                {status !== 'Pending' && (
                  <div className="flex gap-4">
                     <div className="mt-1">
                        <div className={`w-2 h-2 rounded-full ${status === 'Approved' ? 'bg-green-500' : status === 'Rejected' ? 'bg-red-500' : 'bg-blue-500'}`} />
                     </div>
                     <div>
                        <p className="text-sm text-slate-200">
                          <span className="font-bold">Admin User</span> marked as <span className="font-bold">{status}</span>.
                        </p>
                        {reviewerNote && (
                          <p className="text-sm text-slate-400 italic mt-1">"{reviewerNote}"</p>
                        )}
                        <p className="text-xs text-slate-500">Just now</p>
                     </div>
                  </div>
                )}
             </div>
          </div>
        </div>

        {/* Sidebar Info Column */}
        <div className="space-y-6">
           {/* Detection Details */}
           <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
              <h3 className="font-semibold text-white mb-4">Detection Details</h3>
              <div className="space-y-4">
                 <div className="flex justify-between items-center py-2 border-b border-slate-800">
                   <span className="text-slate-400 text-sm">Violation Type</span>
                   <span className="text-orange-400 font-medium text-sm">
                      {incident.detections?.[0]?.type?.replace("_", " ")}
                    </span>
                 </div>
                 <div className="flex justify-between items-center py-2 border-b border-slate-800">
                   <span className="text-slate-400 text-sm">Model Confidence</span>
                   <span className="text-slate-200 font-mono text-sm">
                      {(incident.detections?.[0]?.confidence * 100).toFixed(1)}%
                    </span>
                 </div>
                 <div className="flex justify-between items-center py-2 border-b border-slate-800">
                   <span className="text-slate-400 text-sm">Plate Number</span>
                   <div className="text-right">
                     <div className="bg-white text-black font-bold px-2 py-0.5 rounded text-sm font-mono border-2 border-black">
                       <div className="bg-white text-black font-bold px-2 py-0.5 rounded text-sm font-mono border-2 border-black">
                        {incident.plate_number || 'N/A'}
                      </div>
                     </div>
                     <div className="text-[10px] text-green-500 mt-0.5">OCR Conf: 98%</div>
                   </div>
                 </div>
                 <div className="flex justify-between items-center py-2 border-b border-slate-800">
                   <span className="text-slate-400 text-sm">Passenger Count</span>
                   <span className="text-slate-200 text-sm">1 (Driver Only)</span>
                 </div>
                 <div className="flex justify-between items-center py-2">
                   <span className="text-slate-400 text-sm">Model Version</span>
                   <span className="text-slate-500 text-sm">YOLOv11n-v1.0</span>
                 </div>
              </div>
           </div>

           {/* Context & Conditions */}
           <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
              <h3 className="font-semibold text-white mb-4">Context & Conditions</h3>
              <div className="grid grid-cols-2 gap-4">
                 <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                    <div className="flex items-center gap-2 text-slate-500 mb-1">
                       <MapPin className="w-4 h-4" />
                       <span className="text-xs">Location</span>
                    </div>
                    <div className="font-medium text-sm text-slate-200">
                      {incident.location || 'Unknown Location'}
                    </div>
                 </div>
                 <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                    <div className="flex items-center gap-2 text-slate-500 mb-1">
                       <Clock className="w-4 h-4" />
                       <span className="text-xs">Time</span>
                    </div>
                    <div className="font-medium text-sm text-slate-200">
                      {new Date(incident.timestamp).toLocaleTimeString()}
                    </div>
                 </div>
                 <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                    <div className="flex items-center gap-2 text-slate-500 mb-1">
                       <Sun className="w-4 h-4" />
                       <span className="text-xs">Weather</span>
                    </div>
                    <div className="font-medium text-sm text-slate-200">{incident.weather || 'Clear Sky'}</div>
                 </div>
                 <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                    <div className="flex items-center gap-2 text-slate-500 mb-1">
                       <FileText className="w-4 h-4" />
                       <span className="text-xs">Traffic</span>
                    </div>
                    <div className="font-medium text-sm text-slate-200">{incident.traffic || 'Moderate'}</div>
                 </div>
              </div>
           </div>

           {/* Suggested Action */}
           <div className="bg-blue-900/10 rounded-xl border border-blue-500/20 p-6">
              <h3 className="font-semibold text-blue-400 mb-2 text-sm uppercase tracking-wider">Suggested Violation</h3>
              <p className="text-lg font-bold text-white mb-1">
                {incident.violation_law || 'Republic Act No. 10054'}
              </p>
              <p className="text-sm text-slate-400 mb-4">
                {incident.violation_description || 'Motorcycle Helmet Act of 2009'}
              </p>
              
              <div className="flex justify-between items-center bg-blue-900/20 p-3 rounded-lg border border-blue-500/30">
                 <span className="text-sm text-blue-200">Suggested Fine</span>
                 <span className="text-lg font-bold text-white">
                    ₱{incident.suggested_fine || '1,500.00'}
                  </span>
              </div>
              <p className="text-[10px] text-slate-500 mt-3 text-center">
                 *Disclaimer: System suggestion only. Final validation required.
              </p>
           </div>
        </div>
      </div>

      {/* Decision Modal */}
      {showDecisionModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
           <div className="bg-slate-900 w-full max-w-lg rounded-xl border border-slate-800 shadow-2xl p-6">
              <h3 className="text-xl font-bold text-white mb-2">Confirm {decisionType}</h3>
              <p className="text-slate-400 text-sm mb-6">
                Please provide a reason or note for this decision. This will be recorded in the audit log.
              </p>
              
              <div className="space-y-4 mb-6">
                 <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Reviewer Notes (Optional)</label>
                    <textarea 
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
                      placeholder="Enter details about your decision..."
                      value={reviewerNote}
                      onChange={(e) => setReviewerNote(e.target.value)}
                    />
                 </div>
                 
                 {decisionType === 'Reject' && (
                   <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Reason for Rejection *</label>
                      <select className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:outline-none">
                         <option>False Positive (No Violation)</option>
                         <option>Unclear Image / Obstruction</option>
                         <option>Duplicate Entry</option>
                         <option>Emergency Vehicle</option>
                         <option>Other</option>
                      </select>
                   </div>
                 )}
              </div>

              <div className="flex gap-3 justify-end">
                 <button 
                   onClick={() => setShowDecisionModal(false)}
                   className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
                 >
                   Cancel
                 </button>
                 <button 
                   onClick={handleConfirmDecision}
                   className={`px-4 py-2 rounded-lg text-white font-medium transition-colors ${
                     decisionType === 'Approve' ? 'bg-green-600 hover:bg-green-700' :
                     decisionType === 'Reject' ? 'bg-red-600 hover:bg-red-700' :
                     'bg-blue-600 hover:bg-blue-700'
                   }`}
                 >
                   {isProcessing ? 'Processing...' : 'Confirm Decision'}
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* Confirm Dialog */}
      {showConfirmDialog && (
        <ConfirmDialog
          open={showConfirmDialog}
          onOpenChange={setShowConfirmDialog}
          onConfirm={executeAction}
          title={
            confirmAction === 'approve' ? 'Confirm Approval' :
            confirmAction === 'reject' ? 'Confirm Rejection' :
            confirmAction === 'needsInfo' ? 'Confirm Request for Info' :
            'Confirm Reopen Case'
          }
          description={
            confirmAction === 'approve' ? 'Are you sure you want to approve this incident? This action will record the approval in the audit log and may trigger notification to the violator.' :
            confirmAction === 'reject' ? 'Are you sure you want to reject this incident? This will mark the detection as a false positive or invalid.' :
            confirmAction === 'needsInfo' ? 'Are you sure you want to request additional information for this incident?' :
            'Are you sure you want to reopen this case? This will reset the status back to Pending for review.'
          }
          confirmText={
            confirmAction === 'approve' ? 'Approve Incident' :
            confirmAction === 'reject' ? 'Reject Incident' :
            confirmAction === 'needsInfo' ? 'Request Info' :
            'Reopen Case'
          }
          variant={
            confirmAction === 'approve' ? 'success' :
            confirmAction === 'reject' ? 'danger' :
            confirmAction === 'reopen' ? 'warning' :
            'info'
          }
          loading={isProcessing}
        />
      )}

      {/* Image Viewer */}
      {showImageViewer && (
        <ImageViewer
          open={showImageViewer}
          onClose={() => setShowImageViewer(false)}
          images={evidenceImages}
          initialIndex={selectedImageIndex}
        />
      )}
    </div>
  );
}