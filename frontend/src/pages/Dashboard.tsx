import React, { useSyncExternalStore, useEffect, useMemo, useState } from 'react';
import { Lock, Clock, ShieldAlert, FileText, Activity, CheckCircle, Users, Trash2, FileSearch } from 'lucide-react';

import { useAuth } from '@/contexts/AuthContext';
import { PageHeader } from '@/components/common/PageHeader';
import { StatCard } from '@/components/common/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { piiStore } from '@/stores/piiStore';
import { adminAPI } from '@/lib/api';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

export const Dashboard: React.FC = () => {
  const { user, hasRole } = useAuth();

  // -- USER logic --
  const records = useSyncExternalStore(piiStore.subscribe, piiStore.getRecords, piiStore.getRecords);

  // Trigger load if empty (or could add logic to force reload occasionally)
  useEffect(() => {
    if (hasRole(['user'])) {
      piiStore.loadRecords();
    }
  }, [user]);

  // -- ADMIN logic --
  const [adminUsers, setAdminUsers] = useState<any[]>([]);

  useEffect(() => {
    if (hasRole(['admin'])) {
      loadAdminUsers();
    }
  }, [user]);

  const loadAdminUsers = async () => {
    try {
      const users = await adminAPI.listUsers();
      // Filter out admin users
      const normalUsers = users.filter((u: any) => u.role !== 'admin');
      setAdminUsers(normalUsers);
    } catch (error) {
      console.error("Failed to load users", error);
    }
  };

  const handleDeleteUser = async (userId: number) => {
    try {
      await adminAPI.deleteUser(userId); // Need to add this to api.ts
      toast.success("User deleted successfully");
      loadAdminUsers();
    } catch (error) {
      toast.error("Failed to delete user");
    }
  };


  const formatLastLogin = () => {
    if (!user?.lastLogin) return 'N/A';
    return new Date(user.lastLogin).toLocaleString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  // -- AUDITOR logic --
  const [systemStats, setSystemStats] = useState<any>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  // Derived Statistics
  const totalEncrypted = records.length;

  // Calculate expiry stats
  const expiringSoonCount = useMemo(() => {
    const today = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);

    return records.filter(r => {
      if (!r.expiryDate) return false;
      const exp = new Date(r.expiryDate);
      return exp > today && exp <= thirtyDaysFromNow;
    }).length;
  }, [records]);

  // Generate "Recent Activity" from actual PII records (using lastAccessed or created timestamps if available)
  const recentActivity = useMemo(() => {
    const activityList = [];

    // Add "accessed recently" items
    const recentlyAccessed = [...records]
      .filter(r => r.lastAccessed)
      .sort((a, b) => new Date(b.lastAccessed).getTime() - new Date(a.lastAccessed).getTime())
      .slice(0, 3)
      .map(r => ({
        id: `acc - ${r.id} `,
        action: 'PII Record Accessed',
        item: r.typeLabel, // e.g., "Credit Card"
        time: r.lastAccessed, // e.g. "2024-03-10 10:00"
        type: 'access'
      }));

    activityList.push(...recentlyAccessed);

    if (activityList.length < 4 && user?.lastLogin) {
      activityList.push({
        id: 'login',
        action: 'User Login',
        item: 'System Access',
        time: new Date(user.lastLogin).toLocaleString('en-IN', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        }),
        type: 'create'
      });
    }

    return activityList;
  }, [records, user]);

  useEffect(() => {
    if (hasRole(['admin', 'auditor'])) {
      const loadStats = async () => {
        try {
          const stats = await adminAPI.getStatistics();
          setSystemStats(stats);
        } catch (error) {
          console.error("Failed to load system stats", error);
        } finally {
          setLoadingStats(false);
        }
      };
      loadStats();
    }
  }, [user]);


  // --- RENDER AUDITOR DASHBOARD ---
  if (hasRole(['auditor'])) {
    return (
      <div className="animate-fade-in">
        <PageHeader
          title="Compliance & Audit Overview"
          description="Security monitoring and compliance statistics"
          icon={Activity}
        />

        {loadingStats ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="p-6 h-32 animate-pulse bg-muted/50" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              title="Total System Users"
              value={systemStats?.users?.total || 0}
              subtitle={`${systemStats?.users?.active || 0} currently active`}
              icon={Users}
            />
            <StatCard
              title="Global PII Records"
              value={systemStats?.pii_records?.total || 0}
              subtitle="Encrypted & Masked"
              icon={Lock}
              variant="secure"
            />
            <StatCard
              title="Auth Success Rate"
              value={systemStats?.login_attempts?.total ?
                `${Math.round((systemStats.login_attempts.successful / systemStats.login_attempts.total) * 100)}%` : '0%'}
              subtitle={`Of ${systemStats?.login_attempts?.total || 0} attempts`}
              icon={CheckCircle}
            />
            <StatCard
              title="Security Events"
              value={systemStats?.login_attempts?.total - systemStats?.login_attempts?.successful || 0}
              subtitle="Failed login attempts"
              icon={ShieldAlert}
              variant="warning"
            />
          </div>
        )}


        <Card>
          <CardHeader>
            <CardTitle>Compliance Monitoring</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Clock className="w-16 h-16 text-muted-foreground/20 mb-4" />
            <h3 className="text-lg font-medium">Continuous Security Auditing</h3>
            <p className="text-sm text-muted-foreground mt-2 max-w-sm mb-6">
              As an Auditor, you have read-only access to global security logs and system-wide statistics to ensure regulatory compliance.
            </p>
            <Button asChild>
              <a href="/audit-logs">Go to Global Audit Logs</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // --- RENDER ADMIN DASHBOARD ---
  if (hasRole(['admin'])) {
    return (
      <div className="animate-fade-in">
        <PageHeader
          title={`Admin Control Center`}
          description="System management and infrastructure oversight"
          icon={Users}
          actions={
            <Button variant="outline" asChild>
              <a href="/audit-logs" className="gap-2">
                <FileSearch className="w-4 h-4" />
                Global Audit Logs
              </a>
            </Button>
          }
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard
            title="Total Users"
            value={systemStats?.users?.total || 0}
            icon={Users}
          />
          <StatCard
            title="Encrypted Records"
            value={systemStats?.pii_records?.total || 0}
            icon={Lock}
            variant="secure"
          />
          <StatCard
            title="Security Alerts"
            value={systemStats?.login_attempts?.total - systemStats?.login_attempts?.successful || 0}
            icon={ShieldAlert}
            variant="warning"
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>User Directory & PII Volume</CardTitle>
          </CardHeader>
          <CardContent>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>S.No</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>PII Records Stored</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {adminUsers.map((u, index) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-mono text-xs">{index + 1}</TableCell>
                    <TableCell className="font-medium">{u.username}</TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="font-mono">
                        {u.pii_count || 0} Records
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{u.role}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {u.id !== Number(user?.id) && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete User Account?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete the user <b>{u.username}</b> and
                                <b> DESTROY all {u.pii_count || 0} encrypted PII records</b> associated with them.
                                This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteUser(u.id)}
                                className="bg-destructive hover:bg-destructive/90"
                              >
                                Delete User
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    );
  }



  return (
    <div className="animate-fade-in">
      <PageHeader
        title={`Welcome back, ${user?.username} `}
        description="Your security overview and recent activity"
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Stored PII Records"
          value={totalEncrypted}
          subtitle="All encrypted"
          icon={Lock}
          variant="secure"
        />
        <StatCard
          title="Last Login"
          value={formatLastLogin()}
          icon={Clock}
        />
        <StatCard
          title="Expiring Soon"
          value={expiringSoonCount}
          subtitle="Next 30 days"
          icon={ShieldAlert}
          variant={expiringSoonCount > 0 ? "warning" : "default"}
        />
        <StatCard
          title="Encrypted Files"
          value={0} // Placeholder until File API connected
          subtitle="Secure Storage"
          icon={FileText}
        />
      </div>

      {/* Security Status & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Security Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Activity className="w-5 h-5" />
              Security Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg bg-secure-muted">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-secure" />
                  <div>
                    <p className="font-medium text-foreground">Encryption Active</p>
                    <p className="text-sm text-muted-foreground">256-bit AES-GCM encryption verified</p>
                  </div>
                </div>
                <Badge variant="outline" className="border-secure text-secure bg-secure/5">
                  Active
                </Badge>
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg bg-muted">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-secure" />
                  <div>
                    <p className="font-medium text-foreground">Secure Session</p>
                    <p className="text-sm text-muted-foreground">JWT with secure HTTP-only cookies</p>
                  </div>
                </div>
                <Badge variant="outline" className="border-secure text-secure bg-secure/5">
                  Active
                </Badge>
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg bg-muted">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-foreground">Token Expiry</p>
                    <p className="text-sm text-muted-foreground">Auto-logout on inactivity</p>
                  </div>
                </div>
                <Badge variant="secondary">30 min</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Clock className="w-5 h-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.length > 0 ? (
                recentActivity.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-center justify-between py-3 border-b border-border last:border-0"
                  >
                    <div>
                      <p className="font-medium text-foreground text-sm">{activity.action}</p>
                      <p className="text-sm text-muted-foreground">{activity.item}</p>
                    </div>
                    <div className="text-right">
                      <Badge
                        variant={activity.type === 'alert' ? 'destructive' : 'secondary'}
                        className="mb-1"
                      >
                        {activity.type}
                      </Badge>
                      <p className="text-xs text-muted-foreground">{activity.time}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  No recent activity found.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
