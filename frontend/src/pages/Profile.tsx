import { useState, useEffect } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { User, Moon, Sun, LogOut, Save, Download, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useProfile } from '@/hooks/useProfile';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

export default function Profile() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { profile, fetchProfile, updateProfile, changePassword, exportEntries, deleteAccount, isLoading, error } = useProfile();
  
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [aiConsent, setAiConsent] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  useEffect(() => {
    if (profile) {
      setEditName(profile.name);
      setEditEmail(profile.email);
      setAiConsent(!!profile.aiConsent);
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

  const handleToggleAiConsent = async (value: boolean) => {
    try {
      setAiConsent(value);
      await updateProfile({ aiConsent: value });
      toast({
        title: 'AI insights preference updated',
        description: value
          ? 'You have enabled AI insights for your journal entries.'
          : 'AI insights have been disabled. Your entries will not be analyzed.',
      });
    } catch (err) {
      setAiConsent(!!profile?.aiConsent);
      toast({
        title: 'Failed to update preference',
        description: error || 'Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleExport = async (format: 'pdf' | 'json' | 'txt') => {
    try {
      await exportEntries(format);
      toast({
        title: 'Export started',
        description: `Your ${format.toUpperCase()} export is downloading.`,
      });
    } catch (err) {
      toast({
        title: 'Export failed',
        description: error || 'Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmation.trim().toUpperCase() !== 'DELETE') {
      toast({
        title: 'Confirmation required',
        description: 'Type DELETE to confirm account deletion.',
        variant: 'destructive',
      });
      return;
    }

    if (!deletePassword) {
      toast({
        title: 'Password required',
        description: 'Please enter your password to delete your account.',
        variant: 'destructive',
      });
      return;
    }

    setIsDeletingAccount(true);
    try {
      await deleteAccount(deletePassword);
      toast({
        title: 'Account deleted',
        description: 'Your account and all data have been removed.',
      });
      logout();
      navigate('/');
    } catch (err) {
      toast({
        title: 'Failed to delete account',
        description: error || 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsDeletingAccount(false);
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

          <Card className="p-6">
            <h3 className="mb-4 text-lg font-semibold text-foreground">Data & Privacy</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="ai-consent" className="text-base">
                    AI Insights
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Allow AI to analyze your entries for supportive insights.
                  </p>
                </div>
                <Switch
                  id="ai-consent"
                  checked={aiConsent}
                  onCheckedChange={handleToggleAiConsent}
                />
              </div>

              <div>
                <Label className="text-base">Export Your Entries</Label>
                <p className="text-sm text-muted-foreground">
                  Download your journal in PDF, JSON, or TXT.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button variant="outline" onClick={() => handleExport('pdf')}>
                    <Download className="mr-2 h-4 w-4" />
                    Export PDF
                  </Button>
                  <Button variant="outline" onClick={() => handleExport('json')}>
                    <Download className="mr-2 h-4 w-4" />
                    Export JSON
                  </Button>
                  <Button variant="outline" onClick={() => handleExport('txt')}>
                    <Download className="mr-2 h-4 w-4" />
                    Export TXT
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          <Card className="border-destructive/30 p-6">
            <h3 className="mb-4 text-lg font-semibold text-foreground">Account Actions</h3>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Button
                onClick={handleLogout}
                variant="outline"
                className="w-full sm:w-auto"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </Button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="w-full sm:w-auto">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Account
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete your account?</AlertDialogTitle>
                  </AlertDialogHeader>
                  <Alert className="border-destructive/40">
                    <AlertDescription>
                      This permanently removes your account, journal entries, and insights. Download any
                      entries you want to keep first.
                    </AlertDescription>
                  </Alert>
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="delete-confirmation">Type DELETE to confirm</Label>
                      <Input
                        id="delete-confirmation"
                        value={deleteConfirmation}
                        onChange={(e) => setDeleteConfirmation(e.target.value)}
                        placeholder="DELETE"
                      />
                    </div>
                    <div>
                      <Label htmlFor="delete-password">Password</Label>
                      <Input
                        id="delete-password"
                        type="password"
                        value={deletePassword}
                        onChange={(e) => setDeletePassword(e.target.value)}
                        placeholder="Enter your password"
                      />
                    </div>
                  </div>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteAccount}
                      disabled={isDeletingAccount}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {isDeletingAccount ? 'Deleting...' : 'Delete Account'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
