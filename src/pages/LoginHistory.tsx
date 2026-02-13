import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { authAPI } from '@/lib/api';
import { Clock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

interface LoginEntry {
  id: string;
  timestamp: string;
  status: 'success' | 'failed' | 'blocked';
  ipAddress?: string;
  location?: string;
  activity?: string[];
}


const getStatusConfig = (status: string) => {
  switch (status) {
    case 'success':
      return {
        icon: CheckCircle,
        label: 'Success',
        className: 'border-secure text-secure bg-secure/5',
      };
    case 'failed':
      return {
        icon: XCircle,
        label: 'Failed',
        className: 'border-destructive text-destructive bg-destructive/5',
      };
    case 'blocked':
      return {
        icon: AlertTriangle,
        label: 'Blocked',
        className: 'border-warning text-warning bg-warning/5',
      };
    default:
      return {
        icon: CheckCircle,
        label: status,
        className: 'border-muted-foreground text-muted-foreground',
      };
  }
};

export const LoginHistory: React.FC = () => {
  const { hasRole, isLoading: authLoading } = useAuth();

  // Redirect auditors
  if (!authLoading && hasRole(['auditor', 'admin'])) {
    return <Navigate to="/dashboard" replace />;
  }
  const [history, setHistory] = useState<LoginEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const data = await authAPI.getLoginHistory();
        setHistory(data.map((entry: any) => ({
          id: entry.id,
          timestamp: new Date(entry.timestamp).toLocaleString('en-IN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
          }),
          status: entry.status,
          ipAddress: entry.ip_address,
          location: entry.location,
          activity: entry.activity || []
        })));
      } catch (error) {
        console.error("Failed to load history", error);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const successCount = history.filter(l => l.status === 'success').length;
  const failedCount = history.filter(l => l.status === 'failed').length;
  const blockedCount = history.filter(l => l.status === 'blocked').length;

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Login History"
        description="Review your recent authentication activity"
        icon={Clock}
      />

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card className="p-4 flex items-center gap-4">
          <div className="p-3 rounded-lg bg-secure/10">
            <CheckCircle className="w-5 h-5 text-secure" />
          </div>
          <div>
            <p className="text-2xl font-semibold text-foreground">{successCount}</p>
            <p className="text-sm text-muted-foreground">Successful Logins</p>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-4">
          <div className="p-3 rounded-lg bg-destructive/10">
            <XCircle className="w-5 h-5 text-destructive" />
          </div>
          <div>
            <p className="text-2xl font-semibold text-foreground">{failedCount}</p>
            <p className="text-sm text-muted-foreground">Failed Attempts</p>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-4">
          <div className="p-3 rounded-lg bg-warning/10">
            <AlertTriangle className="w-5 h-5 text-warning" />
          </div>
          <div>
            <p className="text-2xl font-semibold text-foreground">{blockedCount}</p>
            <p className="text-sm text-muted-foreground">Blocked Attempts</p>
          </div>
        </Card>
      </div>

      {/* History Table */}
      <Card>
        <div className="overflow-hidden rounded-xl">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="font-semibold w-[220px]">Timestamp</TableHead>
                <TableHead className="font-semibold w-[120px]">Status</TableHead>
                <TableHead className="font-semibold w-[150px]">IP Address</TableHead>
                <TableHead className="font-semibold w-[200px]">Location</TableHead>
                <TableHead className="font-semibold">Activity in Session</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.map((entry) => {
                const statusConfig = getStatusConfig(entry.status);
                const StatusIcon = statusConfig.icon;

                return (
                  <TableRow key={entry.id} className="hover:bg-muted/30">
                    <TableCell className="font-mono text-[13px] text-foreground py-4">
                      {entry.timestamp}
                    </TableCell>
                    <TableCell className="py-4">
                      <Badge variant="outline" className={cn("px-2 py-0.5", statusConfig.className)}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {statusConfig.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-[13px] text-muted-foreground py-4">
                      {entry.ipAddress || '-'}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground py-4">
                      {entry.location || '-'}
                    </TableCell>
                    <TableCell className="py-4">
                      {entry.activity && entry.activity.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {entry.activity.map((act, i) => (
                            <Badge key={i} variant="secondary" className="text-[10px] py-0 px-1.5 bg-muted/60 text-muted-foreground border-none font-medium">
                              {act}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-[13px] text-muted-foreground italic">
                          {entry.status === 'success' ? 'No activity recorded' : '-'}
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
};

export default LoginHistory;
