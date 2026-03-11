# Toast Notifications Implementation Guide

## Overview

The SafeRide dashboard now features a comprehensive toast notification system powered by Sonner, providing real-time feedback for all user actions and system events.

## ✅ Implemented Features

### 1. **Global Toast System**
- Consistent styling across all notifications
- Positioned at top-right of screen
- Auto-dismiss after 4 seconds (configurable per toast)
- Close button on all toasts
- Dark theme matching SafeRide design system

### 2. **Toast Types**

#### **Success Toasts** ✓
Used for successful operations:
- Incident approval
- Settings saved
- Payment successful
- Login successful
- Data export complete

#### **Error Toasts** ✕
Used for failed operations:
- Login failed
- Payment failed
- API errors
- Validation errors

#### **Warning Toasts** ⚠
Used for alerts and warnings:
- System maintenance
- Model performance alerts
- Session warnings

#### **Info Toasts** ℹ
Used for informational messages:
- Audit log updates
- System status changes
- Logout confirmation
- General notifications

### 3. **Special Toast Types**

#### **Real-Time Violation Alerts** 🚨
```typescript
showToast.violationAlert(
  'No Helmet',           // violation type
  'Main Gate North',     // location
  'ABC-1234'            // plate number (optional)
);
```

Features:
- Red error styling with siren emoji
- 6-second duration
- Includes location and plate number
- Action button available

#### **System Status Notifications**
```typescript
showToast.systemStatus('online', 'All systems operational');
showToast.systemStatus('offline', 'Connection lost');
showToast.systemStatus('maintenance', 'Scheduled maintenance');
```

#### **Payment Notifications**
```typescript
showToast.paymentSuccess(1500, 'GCash');
showToast.paymentFailed('Insufficient funds');
```

#### **Promise Toasts** (Loading States)
```typescript
showToast.promise(apiCall, {
  loading: 'Processing...',
  success: 'Operation completed',
  error: 'Operation failed'
});
```

---

## 📁 File Structure

### **Core Files**

```
/src/app/utils/toast.ts          - Toast utility functions
/src/app/App.tsx                 - Global Toaster component
```

### **Integration Files**

```
/src/app/pages/IncidentDetail.tsx     - Approval/rejection toasts
/src/app/pages/Dashboard.tsx          - Real-time violation alerts
/src/app/pages/Settings.tsx           - Settings update toasts
/src/app/pages/Login.tsx              - Login success/error toasts
/src/app/pages/user/ViolationPayment.tsx - Payment toasts
/src/app/hooks/useAuth.ts             - Logout toast
```

---

## 🎯 Toast Utility API

### **Basic Toasts**

```typescript
import { showToast } from '@/app/utils/toast';

// Success
showToast.success('Title', { description: 'Optional description' });

// Error
showToast.error('Title', { description: 'Optional description' });

// Warning
showToast.warning('Title', { description: 'Optional description' });

// Info
showToast.info('Title', { description: 'Optional description' });
```

### **Specialized Toasts**

```typescript
// Incident approval
showToast.incidentApproved('INC-2024-001');

// Incident rejection
showToast.incidentRejected('INC-2024-001', 'False positive');

// Violation alert
showToast.violationAlert('No Helmet', 'Gate 1', 'ABC-1234');

// System status
showToast.systemStatus('online', 'Systems operational');

// Model performance alert
showToast.modelAlert(85.5, 90);

// Settings updated
showToast.settingsUpdated('Detection thresholds');

// Payment success
showToast.paymentSuccess(1500, 'GCash');

// Payment failed
showToast.paymentFailed('Payment declined');
```

### **Data Export Toasts**

```typescript
// Export started
showToast.exportStarted('csv');

// Export complete
showToast.exportComplete('csv', 150);
```

### **Custom Action Button**

```typescript
showToast.withAction(
  'New violation detected',
  'View Details',
  () => navigate('/incidents/123'),
  'Click to review incident'
);
```

### **Promise Toast (Loading State)**

```typescript
const saveData = async () => {
  const result = await showToast.promise(
    api.saveSettings(),
    {
      loading: 'Saving settings...',
      success: 'Settings saved successfully',
      error: 'Failed to save settings'
    }
  );
};
```

### **Dismiss All Toasts**

```typescript
showToast.dismissAll();
```

---

## 🎨 Customization

### **Toast Configuration** (in App.tsx)

```typescript
<Toaster 
  position="top-right"        // Position on screen
  expand={false}              // Don't expand on hover
  richColors                  // Use rich color scheme
  closeButton                 // Show close button
  duration={4000}             // Auto-dismiss after 4 seconds
  toastOptions={{
    style: {
      background: 'rgb(15 23 42)',     // Dark background
      border: '1px solid rgb(51 65 85)', // Border color
      color: 'rgb(226 232 240)',       // Text color
    },
    className: 'font-sans',
  }}
/>
```

### **Changing Toast Position**

```typescript
<Toaster position="top-center" />   // Top center
<Toaster position="bottom-right" /> // Bottom right
<Toaster position="bottom-center" /> // Bottom center
```

### **Custom Duration**

```typescript
// Short duration (2 seconds)
showToast.success('Quick message', { description: 'Brief notification' });

// In toast utility, modify:
toast.success(message, {
  description,
  duration: 2000, // 2 seconds
});
```

---

## 📋 Implementation Examples

### **1. Incident Approval Flow**

```typescript
// In IncidentDetail.tsx
const confirmDecision = async () => {
  setIsProcessing(true);
  
  try {
    await api.incidents.approve(incidentId);
    
    // Show success toast
    showToast.incidentApproved(incidentId);
    
    // Show follow-up audit log notification
    setTimeout(() => {
      showToast.info('Audit Log Updated', {
        description: 'Incident approval logged for compliance.',
      });
    }, 1500);
    
  } catch (error) {
    showToast.error('Action Failed', {
      description: 'Unable to approve incident. Please try again.',
    });
  } finally {
    setIsProcessing(false);
  }
};
```

### **2. Real-Time Violation Detection**

```typescript
// In Dashboard.tsx
const { isConnected } = useWebSocket((message: WebSocketMessage) => {
  if (message.type === 'new_violation') {
    const violation = message.data;
    
    // Show real-time alert
    showToast.violationAlert(
      violation.violation_type,
      violation.location,
      violation.plate_number
    );
    
    // Update dashboard
    setRecentViolations(prev => [violation, ...prev]);
  }
  
  if (message.type === 'system_status') {
    const status = message.data.status as 'online' | 'offline' | 'maintenance';
    showToast.systemStatus(status, message.data.message);
  }
});
```

### **3. Settings Save**

```typescript
// In Settings.tsx
const handleSaveSettings = async () => {
  setIsSaving(true);
  
  try {
    await api.settings.update({ confidenceThreshold, iouThreshold });
    
    showToast.settingsUpdated('Detection and notification settings');
    
    // Show system reconfiguration notification
    setTimeout(() => {
      showToast.info('System Reconfigured', {
        description: 'Detection parameters applied to all cameras.',
      });
    }, 1500);
    
  } catch (error) {
    showToast.error('Save Failed', {
      description: 'Unable to save settings. Please try again.',
    });
  } finally {
    setIsSaving(false);
  }
};
```

### **4. Payment Processing**

```typescript
// In ViolationPayment.tsx
const handlePayment = async () => {
  setIsProcessing(true);
  
  try {
    const result = await api.payments.process({
      violationId: violation.id,
      method: paymentMethod,
      amount: violation.amount,
    });
    
    showToast.paymentSuccess(violation.amount, getPaymentMethodName(paymentMethod));
    
    setTimeout(() => {
      navigate('/user/violations');
    }, 2000);
    
  } catch (error) {
    showToast.paymentFailed('Payment processing error. Please try again.');
  } finally {
    setIsProcessing(false);
  }
};
```

### **5. Login/Logout**

```typescript
// In Login.tsx
const handleLogin = async () => {
  try {
    await api.auth.login({ username, password });
    
    showToast.success('Login Successful', {
      description: `Welcome to SafeRide ${userType === 'admin' ? 'Admin' : 'User'} Portal`,
    });
    
    navigate('/dashboard');
  } catch (error) {
    showToast.error('Login Failed', {
      description: 'Invalid credentials. Please try again.',
    });
  }
};

// In useAuth.ts
const handleLogout = () => {
  // Clear storage
  localStorage.clear();
  
  showToast.info('Logged Out', {
    description: 'You have been successfully logged out.',
  });
  
  navigate('/');
};
```

---

## 🚀 Advanced Usage

### **Chained Notifications**

```typescript
const processIncident = async () => {
  // Step 1: Start processing
  showToast.info('Processing incident...');
  
  // Step 2: Validate
  await validateIncident();
  showToast.success('Validation complete');
  
  // Step 3: Save
  await saveIncident();
  showToast.success('Incident saved');
  
  // Step 4: Notify
  showToast.info('Notification sent to authorities');
};
```

### **Conditional Toasts**

```typescript
const updateSettings = async (changes: any) => {
  try {
    await api.settings.update(changes);
    
    // Show specific toast based on what changed
    if (changes.confidenceThreshold) {
      showToast.warning('Detection Sensitivity Changed', {
        description: `Threshold updated to ${changes.confidenceThreshold}%`,
      });
    } else {
      showToast.settingsUpdated();
    }
  } catch (error) {
    showToast.error('Update Failed');
  }
};
```

### **Toast with Timeout Action**

```typescript
let toastId: string | number;

const handleDelete = () => {
  toastId = toast('Item deleted', {
    action: {
      label: 'Undo',
      onClick: () => {
        undoDelete();
        toast.dismiss(toastId);
      },
    },
    duration: 5000,
  });
};
```

---

## 🔧 Backend Integration

### **WebSocket Events**

Your FastAPI backend should emit these events:

```python
# Backend WebSocket event for new violations
await websocket.send_json({
    "type": "new_violation",
    "data": {
        "id": "VIO-2024-001",
        "violation_type": "no_helmet",
        "location": "Main Gate North",
        "plate_number": "ABC-1234",
        "timestamp": "2024-03-11T14:32:00Z"
    }
})

# System status updates
await websocket.send_json({
    "type": "system_status",
    "data": {
        "status": "online",
        "message": "All systems operational"
    }
})
```

### **API Response Handling**

```typescript
// In your API service
const apiRequest = async <T>(endpoint: string, options?: RequestInit): Promise<T> => {
  try {
    const response = await fetch(endpoint, options);
    
    if (!response.ok) {
      throw new Error(response.statusText);
    }
    
    return await response.json();
  } catch (error) {
    // Global error toast
    showToast.error('API Error', {
      description: error.message || 'Something went wrong',
    });
    throw error;
  }
};
```

---

## 🎯 Best Practices

### ✅ **Do's**

1. **Use appropriate toast types**
   - Success for completed actions
   - Error for failures
   - Warning for alerts
   - Info for general notifications

2. **Provide context in descriptions**
   ```typescript
   // Good
   showToast.success('Incident Approved', {
     description: 'Incident #INC-001 has been filed and logged.'
   });
   
   // Bad
   showToast.success('Success');
   ```

3. **Chain related notifications**
   ```typescript
   showToast.incidentApproved(id);
   setTimeout(() => {
     showToast.info('Audit log updated');
   }, 1500);
   ```

4. **Use promise toasts for async operations**
   ```typescript
   await showToast.promise(api.call(), {
     loading: 'Loading...',
     success: 'Done!',
     error: 'Failed!'
   });
   ```

### ❌ **Don'ts**

1. **Don't spam toasts**
   ```typescript
   // Bad - too many toasts
   showToast.info('Step 1');
   showToast.info('Step 2');
   showToast.info('Step 3');
   
   // Good - single comprehensive toast
   showToast.info('Processing complete', {
     description: 'All 3 steps completed successfully'
   });
   ```

2. **Don't use toasts for critical errors**
   ```typescript
   // Bad - payment failure needs modal
   showToast.error('Payment failed');
   
   // Good - show modal for critical errors
   setShowErrorModal(true);
   ```

3. **Don't make toasts too long**
   ```typescript
   // Bad
   showToast.info('Very long message that explains everything...', {
     description: 'Even longer description with more details...'
   });
   
   // Good
   showToast.info('Settings Updated', {
     description: 'Changes applied successfully'
   });
   ```

---

## 📊 Toast Analytics (Future Enhancement)

Track toast engagement:

```typescript
const showToastWithAnalytics = (type: string, message: string) => {
  showToast[type](message);
  
  // Log to analytics
  analytics.track('toast_shown', {
    type,
    message,
    timestamp: new Date().toISOString(),
  });
};
```

---

## 🐛 Troubleshooting

### **Toasts not appearing**

1. Check that `<Toaster />` is in `App.tsx`
2. Verify import: `import { toast } from 'sonner'`
3. Check browser console for errors

### **Toasts appear but styling is wrong**

1. Verify `toastOptions` in `<Toaster />`
2. Check for CSS conflicts
3. Ensure Tailwind classes are properly configured

### **Duplicate toasts**

```typescript
// Use toast IDs to prevent duplicates
const toastId = 'unique-id';
if (!toast.isActive(toastId)) {
  toast.success('Message', { id: toastId });
}
```

---

## 📝 Summary

Your SafeRide dashboard now has enterprise-grade toast notifications:

✅ **Global feedback system** for all user actions  
✅ **Real-time violation alerts** with WebSocket integration  
✅ **System status updates** for monitoring  
✅ **Payment confirmations** with detailed info  
✅ **Incident workflow toasts** for approval/rejection  
✅ **Settings update notifications**  
✅ **Login/logout confirmations**  
✅ **Error handling** with user-friendly messages  

The system is production-ready and provides excellent UX feedback!
