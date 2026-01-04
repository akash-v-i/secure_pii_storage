import React from 'react';
import { Lock, Clock, ShieldAlert, FileText, Activity, CheckCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { PageHeader } from '@/components/common/PageHeader';
import { StatCard } from '@/components/common/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const recentActivity = [
  { id: 1, action: 'PII Record Accessed', item: 'Email Address', time: '2 minutes ago', type: 'access' },
  { id: 2, action: 'New Record Added', item: 'Phone Number', time: '1 hour ago', type: 'create' },
  { id: 3, action: 'File Uploaded', item: 'passport.pdf', time: '3 hours ago', type: 'upload' },
  { id: 4, action: 'Security Alert', item: 'New IP Login', time: '5 hours ago', type: 'alert' },
];

export const Dashboard: React.FC = () => {
  const { user } = useAuth();

  const formatLastLogin = () => {
    if (!user?.lastLogin) return 'N/A';
    return new Intl.DateTimeFormat('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(user.lastLogin);
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={`Welcome back, ${user?.username}`}
        description="Your security overview and recent activity"
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Stored PII Records"
          value={12}
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
          title="Security Alerts"
          value={2}
          subtitle="1 unread"
          icon={ShieldAlert}
          variant="warning"
        />
        <StatCard
          title="Encrypted Files"
          value={5}
          subtitle="45.2 MB total"
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
                    <p className="text-sm text-muted-foreground">256-bit AES encryption enabled</p>
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
                    <p className="font-medium text-foreground">Two-Factor Auth</p>
                    <p className="text-sm text-muted-foreground">TOTP authentication enabled</p>
                  </div>
                </div>
                <Badge variant="outline" className="border-secure text-secure bg-secure/5">
                  Enabled
                </Badge>
              </div>
              
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-foreground">Session Timeout</p>
                    <p className="text-sm text-muted-foreground">Auto-lock after 15 minutes</p>
                  </div>
                </div>
                <Badge variant="secondary">15 min</Badge>
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
              {recentActivity.map((activity) => (
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
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
