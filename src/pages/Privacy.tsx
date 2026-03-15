import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { vaultAPI } from '@/lib/api';
import { Settings, Database, Clock, Download, Trash2, Shield, AlertTriangle } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

export const Privacy: React.FC = () => {
  const { hasRole, isLoading: authLoading } = useAuth();

  const [stats, setStats] = useState<any>({
    piiCount: 0,
    fileCount: 0,
    totalFileSize: 0,
    expiringCount: 0,
    auditCount: 0,
    defaultRetention: '365 days'
  });

  const [deletionRequest, setDeletionRequest] = useState<any>(null);
  const [isDeletionModalOpen, setIsDeletionModalOpen] = useState(false);
  const [deletionReason, setDeletionReason] = useState("");

  useEffect(() => {
    const loadStats = async () => {
      try {
        const data = await vaultAPI.getStats();
        setStats(data);
      } catch (error) {
        console.error('Failed to load stats', error);
      }
    };
    const loadDeletionRequest = async () => {
      try {
        const data = await vaultAPI.getDeletionRequest();
        if (data && data.exists) {
          setDeletionRequest(data);
        } else {
          setDeletionRequest(null);
        }
      } catch (error) {
        console.error("Failed to load deletion request", error);
      }
    };
    loadStats();
    loadDeletionRequest();
  }, []);

  // Redirect auditors
  if (!authLoading && hasRole(['auditor', 'admin'])) {
    return <Navigate to="/dashboard" replace />;
  }


  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const handleBackup = async () => {
    try {
      toast.info('Backup initiated', {
        description: 'Your encrypted backup is being prepared for download.',
      });
      await vaultAPI.downloadBackup();
      toast.success('Backup downloaded successfully');
    } catch (error) {
      toast.error('Failed to download backup');
      console.error(error);
    }
  };

  const handleDeletionSubmit = async () => {
    if (!deletionReason.trim()) {
      toast.error('Please provide a reason for deletion.');
      return;
    }
    try {
      const response = await vaultAPI.submitDeletionRequest(deletionReason);

      if (response && response.success === false) {
        toast.error('Cannot submit request', {
          description: response.message || 'An error occurred.'
        });
        return;
      }

      toast.success('Deletion request submitted', {
        description: 'Your request has been sent to the admin for approval.',
      });
      setIsDeletionModalOpen(false);
      setDeletionReason("");

      const data = await vaultAPI.getDeletionRequest();
      if (data && data.exists) {
        setDeletionRequest(data);
      }
    } catch (error) {
      toast.error('Failed to submit deletion request');
      console.error(error);
    }
  };

  const handleConfirmDeletion = async () => {
    try {
      await vaultAPI.confirmDeletionRequest();
      toast.success('Account data deleted successfully.');
      setDeletionRequest(null);
      window.location.reload();
    } catch (error) {
      toast.error('Failed to delete data');
      console.error(error);
    }
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Privacy Dashboard"
        description="Manage your data, privacy settings, and compliance preferences"
        icon={Settings}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Stored Data Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              Stored Data Overview
            </CardTitle>
            <CardDescription>
              Summary of your encrypted data in the vault
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-border">
              <div>
                <p className="font-medium text-foreground">PII Records</p>
                <p className="text-sm text-muted-foreground">Encrypted personal information</p>
              </div>
              <Badge variant="secondary">{stats.piiCount} records</Badge>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-border">
              <div>
                <p className="font-medium text-foreground">Encrypted Files</p>
                <p className="text-sm text-muted-foreground">Documents and images</p>
              </div>
              <Badge variant="secondary">{stats.fileCount} files ({formatFileSize(stats.totalFileSize)})</Badge>
            </div>
            <div className="flex items-center justify-between py-3">
              <div>
                <p className="font-medium text-foreground">Audit Entries</p>
                <p className="text-sm text-muted-foreground">Access and modification logs</p>
              </div>
              <Badge variant="secondary">{stats.auditCount} entries</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Retention & Expiry */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Retention & Expiry Settings
            </CardTitle>
            <CardDescription>
              Configure automatic data lifecycle management
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-border">
              <div>
                <p className="font-medium text-foreground">Default Retention</p>
                <p className="text-sm text-muted-foreground">How long to keep records</p>
              </div>
              <Badge>{stats.defaultRetention}</Badge>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-border">
              <div>
                <p className="font-medium text-foreground">Expiry Notifications</p>
                <p className="text-sm text-muted-foreground">Alert before auto-deletion</p>
              </div>
              <Badge variant="outline" className="border-secure text-secure">Enabled</Badge>
            </div>
            <div className="flex items-center justify-between py-3">
              <div>
                <p className="font-medium text-foreground">Records Expiring Soon</p>
                <p className="text-sm text-muted-foreground">Within the next 30 days</p>
              </div>
              <Badge variant="outline" className="border-warning text-warning">{stats.expiringCount} records</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Download Backup */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="w-5 h-5" />
              Download Encrypted Backup
            </CardTitle>
            <CardDescription>
              Export your data for personal storage or migration
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-muted rounded-lg p-4 mb-4">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-secure flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-foreground">Encrypted Export</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Your backup will be encrypted with your master password.
                    Store it securely - we cannot recover lost backups.
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button onClick={handleBackup} className="gap-2">
                <Download className="w-4 h-4" />
                Download Backup
              </Button>
              <span className="text-sm text-muted-foreground">
                Last backup: Never
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Data Deletion */}
        <Card className="border-destructive/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="w-5 h-5" />
              Request Data Deletion
            </CardTitle>
            <CardDescription>
              Permanently delete all your data from our systems
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-4 mb-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-destructive">Irreversible Action</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    This will permanently delete all your PII records, encrypted files,
                    and account data. This action cannot be undone.
                  </p>
                </div>
              </div>
            </div>

            {deletionRequest ? (
              <div className="mt-4 p-4 border rounded-md border-border bg-muted/50">
                <p className="font-medium">Current Request Status: <span className="capitalize text-primary">{deletionRequest.status}</span></p>
                {deletionRequest.status === 'approved' && (
                  <div className="mt-4">
                    <p className="text-sm mb-3 text-destructive font-medium">Your request has been approved. Please confirm to erase all data permanently.</p>
                    <Button variant="destructive" onClick={handleConfirmDeletion} className="gap-2">
                      Confirm Full Deletion
                    </Button>
                  </div>
                )}
                {deletionRequest.status === 'pending' && (
                  <p className="text-sm text-muted-foreground mt-2">Waiting for administrator approval.</p>
                )}
                {deletionRequest.status === 'rejected' && (
                  <div className="mt-2">
                    <p className="text-sm text-destructive font-medium">Your request was rejected.</p>
                    <p className="text-sm text-muted-foreground mt-1 text-xs">A 7-day cooldown applies after rejection before you can submit a new request.</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsDeletionModalOpen(true)}
                      className="mt-3"
                    >
                      Request Again
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <Button variant="destructive" onClick={() => setIsDeletionModalOpen(true)} className="gap-2">
                <Trash2 className="w-4 h-4" />
                Request Full Deletion
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Compliance Information */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Compliance & Privacy Standards</CardTitle>
          <CardDescription>
            How we protect your data and ensure regulatory compliance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-muted rounded-xl">
              <Badge className="mb-3" variant="outline">GDPR</Badge>
              <h4 className="font-medium text-foreground">EU Data Protection</h4>
              <p className="text-sm text-muted-foreground mt-2">
                Full compliance with European data protection regulations
              </p>
            </div>
            <div className="text-center p-6 bg-muted rounded-xl">
              <Badge className="mb-3" variant="outline">SOC 2</Badge>
              <h4 className="font-medium text-foreground">Security Controls</h4>
              <p className="text-sm text-muted-foreground mt-2">
                Certified security practices and controls
              </p>
            </div>
            <div className="text-center p-6 bg-muted rounded-xl">
              <Badge className="mb-3" variant="outline">AES-256-GCM</Badge>
              <h4 className="font-medium text-foreground">Secure Vaulting</h4>
              <p className="text-sm text-muted-foreground mt-2">
                Unique encryption keys per record with envelope encryption standards.
              </p>
            </div>

          </div>
        </CardContent>
      </Card>

      <Dialog open={isDeletionModalOpen} onOpenChange={setIsDeletionModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Full Deletion</DialogTitle>
            <DialogDescription>
              Please specify the reason for requesting a full deletion of your data. This request will be sent to an administrator for approval.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="Reason for deletion..."
              value={deletionReason}
              onChange={(e) => setDeletionReason(e.target.value)}
              className="resize-none h-24"
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsDeletionModalOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeletionSubmit}>Submit Request</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Privacy;
