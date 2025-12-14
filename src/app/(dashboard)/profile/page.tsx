'use client';

import React, { useState, useEffect } from 'react';
import { Save, User as UserIcon, Lock, Camera, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/ui/form-field';
import { Avatar } from '@/components/ui/avatar';
import { ToastContainer } from '@/components/ui/toast';
import { useToast } from '@/hooks/use-toast';
import { useAuthStore } from '@/stores/auth-store';
import { apiClient, getErrorMessage, getValidationErrors } from '@/lib/api';
import type { User, ProfileFormData, PasswordFormData } from '@/types';

/**
 * Profile card wrapper component
 */
interface ProfileCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}

const ProfileCard: React.FC<ProfileCardProps> = ({ title, description, icon, children }) => (
  <div className="bg-[#2D3748] rounded-lg p-6 shadow-card">
    <div className="flex items-center gap-3 mb-6">
      <div className="p-2 bg-[#3B4B63] rounded-lg">
        {icon}
      </div>
      <div>
        <h2 className="text-lg font-semibold text-white">{title}</h2>
        <p className="text-sm text-[#A0AEC0]">{description}</p>
      </div>
    </div>
    {children}
  </div>
);

// Avatar upload configuration
const avatarUploadConfig = {
  maxSize: 2 * 1024 * 1024, // 2MB
  allowedTypes: ['image/png', 'image/jpeg', 'image/gif'],
};

/**
 * Profile Page
 * Validates: Requirements 13.1, 13.2, 13.3, 13.4, 13.5
 */
export default function ProfilePage() {
  const { toasts, removeToast, success, error: showError } = useToast();
  const { user, setUser } = useAuthStore();

  // Profile form state
  const [profileData, setProfileData] = useState<ProfileFormData>({
    name: '',
    email: '',
  });
  const [profileErrors, setProfileErrors] = useState<Record<string, string>>({});
  const [savingProfile, setSavingProfile] = useState(false);

  // Password form state
  const [passwordData, setPasswordData] = useState<PasswordFormData>({
    current_password: '',
    password: '',
    password_confirmation: '',
  });
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});
  const [savingPassword, setSavingPassword] = useState(false);

  // Avatar state
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [deletingAvatar, setDeletingAvatar] = useState(false);

  /**
   * Initialize form with user data
   * Validates: Requirements 13.1
   */
  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name,
        email: user.email,
      });
      setAvatarPreview(user.avatar);
    }
  }, [user]);

  /**
   * Handle profile field changes
   */
  const handleProfileChange = (field: keyof ProfileFormData, value: string) => {
    setProfileData((prev) => ({ ...prev, [field]: value }));
    if (profileErrors[field]) {
      setProfileErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  /**
   * Handle password field changes
   */
  const handlePasswordChange = (field: keyof PasswordFormData, value: string) => {
    setPasswordData((prev) => ({ ...prev, [field]: value }));
    if (passwordErrors[field]) {
      setPasswordErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  /**
   * Handle avatar file selection
   */
  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!avatarUploadConfig.allowedTypes.includes(file.type)) {
      showError('Invalid file type. Please upload PNG, JPG, or GIF.');
      return;
    }

    // Validate file size
    if (file.size > avatarUploadConfig.maxSize) {
      showError('File size exceeds 2MB limit.');
      return;
    }

    setAvatarFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onload = (event) => {
      setAvatarPreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  /**
   * Upload avatar to server
   * Validates: Requirements 13.5
   */
  const handleAvatarUpload = async () => {
    if (!avatarFile) return;

    setUploadingAvatar(true);
    try {
      const response = await apiClient.upload<User>('/profile/avatar', avatarFile, 'avatar');
      setUser(response.data);
      setAvatarFile(null);
      success('Avatar updated successfully');
    } catch (err) {
      showError(getErrorMessage(err));
    } finally {
      setUploadingAvatar(false);
    }
  };

  /**
   * Delete avatar from server
   */
  const handleAvatarDelete = async () => {
    setDeletingAvatar(true);
    try {
      const response = await apiClient.delete<User>('/profile/avatar');
      setUser(response.data);
      setAvatarPreview(null);
      setAvatarFile(null);
      success('Avatar deleted successfully');
    } catch (err) {
      showError(getErrorMessage(err));
    } finally {
      setDeletingAvatar(false);
    }
  };

  /**
   * Save profile information
   * Validates: Requirements 13.2
   */
  const handleSaveProfile = async () => {
    setSavingProfile(true);
    setProfileErrors({});

    try {
      const response = await apiClient.put<User>('/profile', profileData);
      setUser(response.data);
      success('Profile updated successfully');
    } catch (err) {
      const validationErrors = getValidationErrors(err);
      if (validationErrors) {
        const fieldErrors: Record<string, string> = {};
        Object.entries(validationErrors).forEach(([field, messages]) => {
          fieldErrors[field] = messages[0];
        });
        setProfileErrors(fieldErrors);
      } else {
        showError(getErrorMessage(err));
      }
    } finally {
      setSavingProfile(false);
    }
  };

  /**
   * Change password
   * Validates: Requirements 13.3, 13.4
   */
  const handleChangePassword = async () => {
    setSavingPassword(true);
    setPasswordErrors({});

    try {
      await apiClient.put('/profile/password', passwordData);
      // Clear password fields on success
      setPasswordData({
        current_password: '',
        password: '',
        password_confirmation: '',
      });
      success('Password changed successfully');
    } catch (err) {
      const validationErrors = getValidationErrors(err);
      if (validationErrors) {
        const fieldErrors: Record<string, string> = {};
        Object.entries(validationErrors).forEach(([field, messages]) => {
          fieldErrors[field] = messages[0];
        });
        setPasswordErrors(fieldErrors);
      } else {
        showError(getErrorMessage(err));
      }
    } finally {
      setSavingPassword(false);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#4A90E2]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toast notifications */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Profile</h1>
        <p className="text-[#A0AEC0] mt-1">Manage your account settings</p>
      </div>

      {/* Profile Information Card - Validates: Requirements 13.1, 13.2, 13.5 */}
      <ProfileCard
        title="Profile Information"
        description="Update your personal information and avatar"
        icon={<UserIcon className="h-5 w-5 text-[#4A90E2]" />}
      >
        <div className="space-y-6">
          {/* Avatar section */}
          <div className="flex items-center gap-6">
            <div className="relative">
              <Avatar
                src={avatarPreview}
                name={user.name}
                size="lg"
                className="h-24 w-24 text-2xl"
              />
              <label
                htmlFor="avatar-upload"
                className="absolute bottom-0 right-0 p-2 bg-[#4A90E2] rounded-full cursor-pointer hover:bg-[#6B80E5] transition-colors"
              >
                <Camera className="h-4 w-4 text-white" />
                <input
                  id="avatar-upload"
                  type="file"
                  accept={avatarUploadConfig.allowedTypes.join(',')}
                  onChange={handleAvatarSelect}
                  className="hidden"
                />
              </label>
            </div>
            <div className="flex flex-col gap-2">
              <p className="text-sm text-[#A0AEC0]">
                PNG, JPG, or GIF (max 2MB)
              </p>
              <div className="flex gap-2">
                {avatarFile && (
                  <Button
                    onClick={handleAvatarUpload}
                    loading={uploadingAvatar}
                    className="text-sm"
                  >
                    Upload
                  </Button>
                )}
                {user.avatar && !avatarFile && (
                  <Button
                    variant="secondary"
                    onClick={handleAvatarDelete}
                    loading={deletingAvatar}
                    className="text-sm"
                  >
                    <Trash2 className="h-4 w-4" />
                    Remove
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Profile form */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField label="Name" name="name" error={profileErrors.name} required>
              <Input
                id="name"
                value={profileData.name}
                onChange={(e) => handleProfileChange('name', e.target.value)}
                placeholder="Enter your name"
                error={!!profileErrors.name}
              />
            </FormField>

            <FormField label="Email" name="email" error={profileErrors.email} required>
              <Input
                id="email"
                type="email"
                value={profileData.email}
                onChange={(e) => handleProfileChange('email', e.target.value)}
                placeholder="Enter your email"
                error={!!profileErrors.email}
              />
            </FormField>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSaveProfile} loading={savingProfile}>
              <Save className="h-4 w-4" />
              Save Changes
            </Button>
          </div>
        </div>
      </ProfileCard>

      {/* Change Password Card - Validates: Requirements 13.3, 13.4 */}
      <ProfileCard
        title="Change Password"
        description="Update your password to keep your account secure"
        icon={<Lock className="h-5 w-5 text-[#DD6B20]" />}
      >
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <FormField
                label="Current Password"
                name="current_password"
                error={passwordErrors.current_password}
                required
              >
                <Input
                  id="current_password"
                  type="password"
                  value={passwordData.current_password}
                  onChange={(e) => handlePasswordChange('current_password', e.target.value)}
                  placeholder="Enter current password"
                  error={!!passwordErrors.current_password}
                />
              </FormField>
            </div>

            <FormField
              label="New Password"
              name="password"
              error={passwordErrors.password}
              required
            >
              <Input
                id="password"
                type="password"
                value={passwordData.password}
                onChange={(e) => handlePasswordChange('password', e.target.value)}
                placeholder="Enter new password"
                error={!!passwordErrors.password}
              />
            </FormField>

            <FormField
              label="Confirm New Password"
              name="password_confirmation"
              error={passwordErrors.password_confirmation}
              required
            >
              <Input
                id="password_confirmation"
                type="password"
                value={passwordData.password_confirmation}
                onChange={(e) => handlePasswordChange('password_confirmation', e.target.value)}
                placeholder="Confirm new password"
                error={!!passwordErrors.password_confirmation}
              />
            </FormField>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleChangePassword} loading={savingPassword}>
              <Lock className="h-4 w-4" />
              Change Password
            </Button>
          </div>
        </div>
      </ProfileCard>
    </div>
  );
}
