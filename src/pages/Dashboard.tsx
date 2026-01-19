import React, { useSyncExternalStore, useEffect, useMemo, useState } from 'react';
import { Lock, Clock, ShieldAlert, FileText, Activity, CheckCircle, Users, Trash2 } from 'lucide-react';
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
    return new Intl.DateTimeFormat('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(user.lastLogin);
  };

  // --- RENDER ADMIN DASHBOARD ---
  if (hasRole(['admin'])) {
    return (
      <div className="animate-fade-in">
        <PageHeader
          title={`Admin Dashboard`}
          description="Manage users and view encryption statistics"
          icon={Users}
        />

        <Card>
          <CardHeader>
            <CardTitle>Registered Users & PII Volume</CardTitle>
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

  // --- RENDER USER DASHBOARD (Existing) ---
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
  // Note: Real audit logs would come from a dedicated API, but we can approximate "recent PII usage" here
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

    // If we had a "created_at" field on PIIRecord in frontend store, we could show "Created" events too.
    // For now, let's fill with some system events if list is short
    if (activityList.length < 4 && user?.lastLogin) {
      activityList.push({
        id: 'login',
        action: 'User Login',
        item: 'System Access',
        time: new Date(user.lastLogin).toISOString().replace('T', ' ').slice(0, 16),
        type: 'create'
      });
    }

    return activityList;
  }, [records, user]);

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
