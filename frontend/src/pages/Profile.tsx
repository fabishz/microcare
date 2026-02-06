import { useState, useEffect } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { User, Moon, Sun, LogOut, Save } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useProfile } from '@/hooks/useProfile';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

export default function Profile() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { profile, fetchProfile, updateProfile, changePassword, isLoading, error } = useProfile();
  
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  useEffect(() => {
    if (profile) {
      setEditName(profile.name);
      setEditEmail(profile.email);
    }
  }, [profile]);

  useEffect(() => {
    if (error) {
      toast({
        title: 'Error',
        description: error,
        variant: 'destructive',
      });
    }
  }, [error, toast]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleUpdateProfile = async () => {
    if (!editName.trim() || !editEmail.trim()) {
      toast({
        title: 'Validation error',
        description: 'Name and email are required.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await updateProfile({
        name: editName,
        email: editEmail,
      });

      toast({
        title: 'Profile updated',
        description: 'Your profile has been updated successfully.',
      });
      setIsEditingProfile(false);
    } catch (err) {
      toast({
        title: 'Failed to update profile',
        description: error || 'Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({
        title: 'Validation error',
        description: 'All password fields are required.',
        variant: 'destructive',
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: 'Validation error',
        description: 'New passwords do not match.',
        variant: 'destructive',
      });
      return;
    }

    if (newPassword.length < 8) {
      toast({
        title: 'Validation error',
        description: 'New password must be at least 8 characters.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await changePassword({
        currentPassword,
        newPassword,
      });

      toast({
        title: 'Password changed',
        description: 'Your password has been updated successfully.',
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setIsChangingPassword(false);
    } catch (err) {
      toast({
        title: 'Failed to change password',
        description: error || 'Please try again.',
        variant: 'destructive',
      });
    }
  };

  if (isLoading && !profile) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="mb-2 text-4xl font-bold text-foreground">Profile</h1>
          <p className="text-lg text-muted-foreground">
            Manage your account settings
          </p>
        </div>

        <div className="space-y-6">
          <Card className="p-6">
            <div className="mb-6 flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <User className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground">{profile?.name || user?.name}</h2>
                <p className="text-muted-foreground">{profile?.email || user?.email}</p>
              </div>
            </div>

            {!isEditingProfile ? (
              <Button
                onClick={() => setIsEditingProfile(true)}
                variant="outline"
              >
                Edit Profile
              </Button>
            ) : (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    placeholder="Your email"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleUpdateProfile}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <LoadingSpinner size="sm" />
                        <span className="ml-2">Saving...</span>
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Changes
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={() => setIsEditingProfile(false)}
                    variant="outline"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </Card>

          <Card className="p-6">
            <h3 className="mb-4 text-lg font-semibold text-foreground">Change Password</h3>
            {!isChangingPassword ? (
              <Button
                onClick={() => setIsChangingPassword(true)}
                variant="outline"
              >
                Change Password
              </Button>
            ) : (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="current-password">Current Password</Label>
                  <Input
                    id="current-password"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                  />
                </div>
                <div>
                  <Label htmlFor="new-password">New Password</Label>
                  <Input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                  />
                </div>
                <div>
                  <Label htmlFor="confirm-password">Confirm Password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleChangePassword}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <LoadingSpinner size="sm" />
                        <span className="ml-2">Updating...</span>
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Update Password
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={() => setIsChangingPassword(false)}
                    variant="outline"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </Card>

          <Card className="p-6">
            <h3 className="mb-4 text-lg font-semibold text-foreground">Appearance</h3>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {theme === 'light' ? (
                  <Sun className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <Moon className="h-5 w-5 text-muted-foreground" />
                )}
                <div>
                  <Label htmlFor="theme-toggle" className="text-base">
                    Dark Mode
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {theme === 'dark' ? 'Perfect for evening journaling' : 'Bright and clear'}
                  </p>
                </div>
              </div>
              <Switch
                id="theme-toggle"
                checked={theme === 'dark'}
                onCheckedChange={toggleTheme}
              />
            </div>
          </Card>

          <Card className="border-destructive/20 p-6">
            <h3 className="mb-4 text-lg font-semibold text-foreground">Account Actions</h3>
            <Button
              onClick={handleLogout}
              variant="destructive"
              className="w-full sm:w-auto"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}
