import React, { useState } from 'react';
import { User, Mail, Phone, MapPin, Calendar, Shield, Edit2, Save, X, Lock, Plus, Trash2, Key } from 'lucide-react';
import { showToast } from '@/app/utils/toast';
import { componentStyles, transitions, cx, badgeStyles, animations } from '@/app/utils/animations';

interface Vehicle {
  id: number;
  plateNumber: string;
  make: string;
  model: string;
  year: number;
  color: string;
}

export function UserProfile() {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: 'Juan',
    lastName: 'Dela Cruz',
    email: 'juan.delacruz@email.com',
    phone: '+63 917 123 4567',
    address: '123 Main St, Quezon City, Metro Manila',
    licenseNumber: 'N01-12-345678',
    licenseExpiry: '2026-12-31',
  });

  const [vehicles, setVehicles] = useState<Vehicle[]>([
    {
      id: 1,
      plateNumber: 'ABC-1234',
      make: 'Honda',
      model: 'Click 150i',
      year: 2022,
      color: 'Black',
    },
  ]);

  // Dialog states
  const [showAddVehicleDialog, setShowAddVehicleDialog] = useState(false);
  const [showEditVehicleDialog, setShowEditVehicleDialog] = useState(false);
  const [showRemoveVehicleDialog, setShowRemoveVehicleDialog] = useState(false);
  const [showChangePasswordDialog, setShowChangePasswordDialog] = useState(false);
  const [show2FADialog, setShow2FADialog] = useState(false);
  
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [newVehicle, setNewVehicle] = useState({
    plateNumber: '',
    make: '',
    model: '',
    year: new Date().getFullYear(),
    color: '',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleSave = () => {
    // Save logic here
    showToast.success('Profile updated successfully');
    setIsEditing(false);
  };

  const handleCancel = () => {
    // Reset to original data if needed
    setIsEditing(false);
    showToast.info('Changes cancelled');
  };

  // Vehicle Management
  const handleAddVehicle = () => {
    if (!newVehicle.plateNumber || !newVehicle.make || !newVehicle.model || !newVehicle.color) {
      showToast.error('Please fill in all vehicle details');
      return;
    }

    const vehicleToAdd: Vehicle = {
      id: vehicles.length + 1,
      ...newVehicle,
    };

    setVehicles([...vehicles, vehicleToAdd]);
    setNewVehicle({
      plateNumber: '',
      make: '',
      model: '',
      year: new Date().getFullYear(),
      color: '',
    });
    setShowAddVehicleDialog(false);
    showToast.success(`Vehicle ${newVehicle.plateNumber} added successfully`);
  };

  const handleEditVehicle = () => {
    if (!selectedVehicle) return;

    setVehicles(vehicles.map(v => 
      v.id === selectedVehicle.id ? selectedVehicle : v
    ));
    setShowEditVehicleDialog(false);
    setSelectedVehicle(null);
    showToast.success('Vehicle updated successfully');
  };

  const handleRemoveVehicle = () => {
    if (!selectedVehicle) return;

    setVehicles(vehicles.filter(v => v.id !== selectedVehicle.id));
    setShowRemoveVehicleDialog(false);
    showToast.success(`Vehicle ${selectedVehicle.plateNumber} removed`);
    setSelectedVehicle(null);
  };

  // Security Settings
  const handleChangePassword = () => {
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      showToast.error('Please fill in all password fields');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showToast.error('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 8) {
      showToast.error('Password must be at least 8 characters long');
      return;
    }

    // Simulate password change
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
    setShowChangePasswordDialog(false);
    showToast.success('Password changed successfully');
  };

  const handleEnable2FA = () => {
    // Simulate 2FA enablement
    setShow2FADialog(false);
    showToast.success('Two-Factor Authentication enabled successfully');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">My Profile</h2>
          <p className="text-slate-400">Manage your personal information and vehicles</p>
        </div>
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className={componentStyles.buttonPrimary}
          >
            <Edit2 className="w-4 h-4" />
            Edit Profile
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              className={componentStyles.buttonSuccess}
            >
              <Save className="w-4 h-4" />
              Save
            </button>
            <button
              onClick={handleCancel}
              className={componentStyles.buttonSecondary}
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* Personal Information */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
        <div className="p-6 border-b border-slate-800">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <User className="w-5 h-5" />
            Personal Information
          </h3>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">First Name</label>
            {isEditing ? (
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg py-2 px-4 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            ) : (
              <div className="text-slate-200">{formData.firstName}</div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Last Name</label>
            {isEditing ? (
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg py-2 px-4 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            ) : (
              <div className="text-slate-200">{formData.lastName}</div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2 flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Email Address
            </label>
            {isEditing ? (
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg py-2 px-4 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            ) : (
              <div className="text-slate-200">{formData.email}</div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2 flex items-center gap-2">
              <Phone className="w-4 h-4" />
              Phone Number
            </label>
            {isEditing ? (
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg py-2 px-4 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            ) : (
              <div className="text-slate-200">{formData.phone}</div>
            )}
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-400 mb-2 flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Address
            </label>
            {isEditing ? (
              <textarea
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                rows={2}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg py-2 px-4 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            ) : (
              <div className="text-slate-200">{formData.address}</div>
            )}
          </div>
        </div>
      </div>

      {/* License Information */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Shield className="w-5 h-5" />
              LTO License Information
            </h3>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Lock className="w-4 h-4" />
              <span>Read-only (LTO Issued)</span>
            </div>
          </div>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">License Number</label>
            <div className="w-full bg-slate-950/50 border border-slate-700/50 rounded-lg py-2 px-4 text-slate-400 font-mono cursor-not-allowed">
              {formData.licenseNumber}
            </div>
            <p className="text-xs text-slate-500 mt-1">Cannot be modified. Contact LTO to update.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Expiry Date
            </label>
            <div className="w-full bg-slate-950/50 border border-slate-700/50 rounded-lg py-2 px-4 text-slate-400 cursor-not-allowed">
              {new Date(formData.licenseExpiry).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </div>
            <p className="text-xs text-slate-500 mt-1">Cannot be modified. Contact LTO to update.</p>
          </div>
        </div>
      </div>

      {/* Registered Vehicles */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">Registered Vehicles</h3>
          <button className="text-sm text-blue-400 hover:text-blue-300 font-medium" onClick={() => setShowAddVehicleDialog(true)}>
            + Add Vehicle
          </button>
        </div>

        <div className="divide-y divide-slate-800">
          {vehicles.map((vehicle) => (
            <div key={vehicle.id} className="p-6 hover:bg-slate-800/50 transition-colors">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-mono font-bold text-lg text-blue-400">{vehicle.plateNumber}</span>
                    <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-500/10 text-green-400">
                      Active
                    </span>
                  </div>
                  <div className="text-slate-200 font-semibold mb-1">
                    {vehicle.year} {vehicle.make} {vehicle.model}
                  </div>
                  <div className="text-sm text-slate-400">Color: {vehicle.color}</div>
                </div>
                <div className="flex gap-2">
                  <button className="text-sm text-blue-400 hover:text-blue-300" onClick={() => {
                    setSelectedVehicle(vehicle);
                    setShowEditVehicleDialog(true);
                  }}>Edit</button>
                  <button className="text-sm text-red-400 hover:text-red-300" onClick={() => {
                    setSelectedVehicle(vehicle);
                    setShowRemoveVehicleDialog(true);
                  }}>Remove</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Security Settings */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
        <div className="p-6 border-b border-slate-800">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Security Settings
          </h3>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-slate-200">Password</div>
              <div className="text-sm text-slate-400">Last changed 28 days ago</div>
            </div>
            <button className="px-4 py-2 bg-slate-800 text-slate-200 rounded-lg hover:bg-slate-700 transition-colors text-sm" onClick={() => setShowChangePasswordDialog(true)}>
              Change Password
            </button>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-800">
            <div>
              <div className="font-medium text-slate-200">Two-Factor Authentication</div>
              <div className="text-sm text-slate-400">Add an extra layer of security</div>
            </div>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm" onClick={() => setShow2FADialog(true)}>
              Enable
            </button>
          </div>
        </div>
      </div>

      {/* Add Vehicle Dialog */}
      {showAddVehicleDialog && (
        <div className={componentStyles.dialogOverlay}>
          <div className={cx(componentStyles.dialogContent, "w-96 max-w-full", animations.fadeInZoom)}>
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Add Vehicle
            </h3>
            <div className="space-y-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Plate Number</label>
                <input
                  type="text"
                  value={newVehicle.plateNumber}
                  onChange={(e) => setNewVehicle({ ...newVehicle, plateNumber: e.target.value })}
                  className={componentStyles.input}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Make</label>
                <input
                  type="text"
                  value={newVehicle.make}
                  onChange={(e) => setNewVehicle({ ...newVehicle, make: e.target.value })}
                  className={componentStyles.input}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Model</label>
                <input
                  type="text"
                  value={newVehicle.model}
                  onChange={(e) => setNewVehicle({ ...newVehicle, model: e.target.value })}
                  className={componentStyles.input}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Year</label>
                <input
                  type="number"
                  value={newVehicle.year}
                  onChange={(e) => setNewVehicle({ ...newVehicle, year: parseInt(e.target.value) })}
                  className={componentStyles.input}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Color</label>
                <input
                  type="text"
                  value={newVehicle.color}
                  onChange={(e) => setNewVehicle({ ...newVehicle, color: e.target.value })}
                  className={componentStyles.input}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                className={componentStyles.buttonSecondary}
                onClick={() => setShowAddVehicleDialog(false)}
              >
                Cancel
              </button>
              <button
                className={componentStyles.buttonSuccess}
                onClick={handleAddVehicle}
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Vehicle Dialog */}
      {showEditVehicleDialog && selectedVehicle && (
        <div className={componentStyles.dialogOverlay}>
          <div className={cx(componentStyles.dialogContent, "w-96 max-w-full", animations.fadeInZoom)}>
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Edit2 className="w-5 h-5" />
              Edit Vehicle
            </h3>
            <div className="space-y-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Plate Number</label>
                <input
                  type="text"
                  value={selectedVehicle.plateNumber}
                  onChange={(e) => setSelectedVehicle({ ...selectedVehicle, plateNumber: e.target.value })}
                  className={componentStyles.input}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Make</label>
                <input
                  type="text"
                  value={selectedVehicle.make}
                  onChange={(e) => setSelectedVehicle({ ...selectedVehicle, make: e.target.value })}
                  className={componentStyles.input}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Model</label>
                <input
                  type="text"
                  value={selectedVehicle.model}
                  onChange={(e) => setSelectedVehicle({ ...selectedVehicle, model: e.target.value })}
                  className={componentStyles.input}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Year</label>
                <input
                  type="number"
                  value={selectedVehicle.year}
                  onChange={(e) => setSelectedVehicle({ ...selectedVehicle, year: parseInt(e.target.value) })}
                  className={componentStyles.input}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Color</label>
                <input
                  type="text"
                  value={selectedVehicle.color}
                  onChange={(e) => setSelectedVehicle({ ...selectedVehicle, color: e.target.value })}
                  className={componentStyles.input}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                className={componentStyles.buttonSecondary}
                onClick={() => setShowEditVehicleDialog(false)}
              >
                Cancel
              </button>
              <button
                className={componentStyles.buttonSuccess}
                onClick={handleEditVehicle}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Remove Vehicle Dialog */}
      {showRemoveVehicleDialog && selectedVehicle && (
        <div className={componentStyles.dialogOverlay}>
          <div className={cx(componentStyles.dialogContent, "w-96 max-w-full", animations.fadeInZoom)}>
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-red-400" />
              Remove Vehicle
            </h3>
            <div className="space-y-4 mt-4">
              <p className="text-slate-200">Are you sure you want to remove the vehicle with plate number <span className="font-bold text-blue-400">{selectedVehicle.plateNumber}</span>?</p>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                className={componentStyles.buttonSecondary}
                onClick={() => setShowRemoveVehicleDialog(false)}
              >
                Cancel
              </button>
              <button
                className={componentStyles.buttonDanger}
                onClick={handleRemoveVehicle}
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Change Password Dialog */}
      {showChangePasswordDialog && (
        <div className={componentStyles.dialogOverlay}>
          <div className={cx(componentStyles.dialogContent, "w-96 max-w-full", animations.fadeInZoom)}>
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Key className="w-5 h-5" />
              Change Password
            </h3>
            <div className="space-y-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Current Password</label>
                <input
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  className={componentStyles.input}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">New Password</label>
                <input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  className={componentStyles.input}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Confirm New Password</label>
                <input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  className={componentStyles.input}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                className={componentStyles.buttonSecondary}
                onClick={() => setShowChangePasswordDialog(false)}
              >
                Cancel
              </button>
              <button
                className={componentStyles.buttonSuccess}
                onClick={handleChangePassword}
              >
                Change Password
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Enable 2FA Dialog */}
      {show2FADialog && (
        <div className={componentStyles.dialogOverlay}>
          <div className={cx(componentStyles.dialogContent, "w-96 max-w-full", animations.fadeInZoom)}>
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Lock className="w-5 h-5" />
              Enable Two-Factor Authentication
            </h3>
            <div className="space-y-4 mt-4">
              <p className="text-slate-200">Are you sure you want to enable Two-Factor Authentication? This will add an extra layer of security to your account.</p>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                className={componentStyles.buttonSecondary}
                onClick={() => setShow2FADialog(false)}
              >
                Cancel
              </button>
              <button
                className={componentStyles.buttonPrimary}
                onClick={handleEnable2FA}
              >
                Enable
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}