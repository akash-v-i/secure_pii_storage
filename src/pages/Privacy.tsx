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

  useEffect(() => {
    const loadStats = async () => {
      try {
        const data = await vaultAPI.getStats();
        setStats(data);
      } catch (error) {
        console.error('Failed to load stats', error);
      }
    };
    loadStats();
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

  const handleBackup = () => {
    toast.success('Backup initiated', {
      description: 'Your encrypted backup is being prepared for download.',
    });
    // In real app, call endpoint to generate zip
  };

  const handleDeletionRequest = () => {
    toast.info('Deletion request submitted', {
      description: 'Your request has been logged. You will receive confirmation within 24 hours.',
    });
    // API call would go here
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
            <Button variant="destructive" onClick={handleDeletionRequest} className="gap-2">
              <Trash2 className="w-4 h-4" />
              Request Full Deletion
            </Button>
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
    </div>
  );
};

export default Privacy;
