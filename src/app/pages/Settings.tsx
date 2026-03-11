import React, { useState } from 'react';
import { Slider } from '../components/ui/slider';
import { showToast } from '@/app/utils/toast';
import { ConfirmDialog } from '@/app/components/ConfirmDialog';

export function Settings() {
  const [confidenceThreshold, setConfidenceThreshold] = useState([90]);
  const [iouThreshold, setIouThreshold] = useState([45]);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [soundAlerts, setSoundAlerts] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);

  // Original values to track changes
  const [originalValues] = useState({
    confidenceThreshold: [90],
    iouThreshold: [45],
    emailAlerts: true,
    soundAlerts: true,
  });

  const handleSettingChange = (setter: Function, value: any) => {
    setter(value);
    setHasUnsavedChanges(true);
  };

  const handleSaveClick = () => {
    setShowSaveConfirm(true);
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    setShowSaveConfirm(false);
    
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      showToast.settingsUpdated('Detection and notification settings');
      
      // Show system status update
      setTimeout(() => {
        showToast.info('System Reconfigured', 'Detection parameters applied to all active cameras.');
      }, 1500);
      
      setHasUnsavedChanges(false);
      
    } catch (error) {
      showToast.error('Save Failed', 'Unable to save settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDiscardChanges = () => {
    setConfidenceThreshold(originalValues.confidenceThreshold);
    setIouThreshold(originalValues.iouThreshold);
    setEmailAlerts(originalValues.emailAlerts);
    setSoundAlerts(originalValues.soundAlerts);
    setHasUnsavedChanges(false);
    showToast.info('Changes Discarded', 'All unsaved changes have been reverted.');
  };

  return (
    <div className="space-y-6">
       <div>
          <h2 className="text-2xl font-bold text-white">Camera Settings</h2>
          <p className="text-slate-400">Configure YOLOv11 detection parameters</p>
        </div>

        <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 space-y-6">
           <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Detection Thresholds</h3>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-slate-300">Confidence Threshold</label>
                  <span className="text-sm font-mono text-blue-400">{confidenceThreshold[0]}%</span>
                </div>
                <Slider
                  value={confidenceThreshold}
                  onValueChange={(value) => handleSettingChange(setConfidenceThreshold, value)}
                  min={0}
                  max={100}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-slate-500">
                  <span>0%</span>
                  <span>50%</span>
                  <span>100%</span>
                </div>
              </div>

               <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-slate-300">IOU Threshold</label>
                  <span className="text-sm font-mono text-blue-400">{iouThreshold[0]}%</span>
                </div>
                <Slider
                  value={iouThreshold}
                  onValueChange={(value) => handleSettingChange(setIouThreshold, value)}
                  min={0}
                  max={100}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-slate-500">
                  <span>0%</span>
                  <span>50%</span>
                  <span>100%</span>
                </div>
              </div>
           </div>

           <div className="pt-6 border-t border-slate-800">
             <h3 className="text-lg font-semibold text-white mb-4">Notification Settings</h3>
             <div className="space-y-3">
               <label className="flex items-center gap-3">
                 <input 
                   type="checkbox" 
                   checked={emailAlerts}
                   onChange={(e) => handleSettingChange(setEmailAlerts, e.target.checked)}
                   className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-blue-600 focus:ring-blue-600 focus:ring-offset-slate-900" 
                 />
                 <span className="text-slate-300">Email Alerts for Overloading</span>
               </label>
               <label className="flex items-center gap-3">
                 <input 
                   type="checkbox" 
                   checked={soundAlerts}
                   onChange={(e) => handleSettingChange(setSoundAlerts, e.target.checked)}
                   className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-blue-600 focus:ring-blue-600 focus:ring-offset-slate-900" 
                 />
                 <span className="text-slate-300">Real-time Dashboard Sound</span>
               </label>
             </div>
           </div>

           <div className="pt-6 border-t border-slate-800 flex gap-3">
              <button 
                onClick={handleSaveClick}
                disabled={isSaving || !hasUnsavedChanges}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
              <button 
                onClick={handleDiscardChanges}
                disabled={!hasUnsavedChanges}
                className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Discard Changes
              </button>
              {hasUnsavedChanges && (
                <span className="flex items-center text-orange-400 text-sm ml-2">
                  <span className="w-2 h-2 bg-orange-400 rounded-full mr-2 animate-pulse" />
                  Unsaved changes
                </span>
              )}
           </div>
        </div>
        
        <ConfirmDialog
          open={showSaveConfirm}
          onOpenChange={setShowSaveConfirm}
          onConfirm={handleSaveSettings}
          title="Save Settings Changes"
          description="Are you sure you want to save these changes? This will update the YOLOv11 detection parameters across all active cameras and may affect ongoing detection operations."
          confirmText="Save Changes"
          variant="warning"
          loading={isSaving}
        />
    </div>
  );
}