import React from 'react';
import { Clock, MapPin, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
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

interface LoginEntry {
  id: string;
  timestamp: string;
  ipAddress: string;
  country: string;
  city: string;
  status: 'success' | 'failed' | 'blocked';
  device?: string;
}

const mockLoginHistory: LoginEntry[] = [
  { id: '1', timestamp: '2024-01-15 14:30:00', ipAddress: '192.168.1.45', country: 'United States', city: 'San Francisco', status: 'success', device: 'Chrome / macOS' },
  { id: '2', timestamp: '2024-01-15 12:15:00', ipAddress: '10.0.0.25', country: 'United States', city: 'San Francisco', status: 'failed', device: 'Firefox / Windows' },
  { id: '3', timestamp: '2024-01-14 16:45:00', ipAddress: '192.168.1.45', country: 'United States', city: 'San Francisco', status: 'success', device: 'Chrome / macOS' },
  { id: '4', timestamp: '2024-01-14 09:00:00', ipAddress: '172.16.0.100', country: 'Germany', city: 'Berlin', status: 'blocked', device: 'Unknown' },
  { id: '5', timestamp: '2024-01-13 11:30:00', ipAddress: '192.168.1.45', country: 'United States', city: 'San Francisco', status: 'success', device: 'Safari / iOS' },
  { id: '6', timestamp: '2024-01-12 08:20:00', ipAddress: '192.168.1.45', country: 'United States', city: 'San Francisco', status: 'success', device: 'Chrome / macOS' },
  { id: '7', timestamp: '2024-01-11 15:10:00', ipAddress: '192.168.1.45', country: 'United States', city: 'San Francisco', status: 'failed', device: 'Chrome / macOS' },
];

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
  const successCount = mockLoginHistory.filter(l => l.status === 'success').length;
  const failedCount = mockLoginHistory.filter(l => l.status === 'failed').length;
  const blockedCount = mockLoginHistory.filter(l => l.status === 'blocked').length;

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
                <TableHead className="font-semibold">Timestamp</TableHead>
                <TableHead className="font-semibold">IP Address</TableHead>
                <TableHead className="font-semibold">Location</TableHead>
                <TableHead className="font-semibold">Device</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockLoginHistory.map((entry) => {
                const statusConfig = getStatusConfig(entry.status);
                const StatusIcon = statusConfig.icon;

                return (
                  <TableRow key={entry.id} className="hover:bg-muted/30">
                    <TableCell className="font-mono text-sm text-foreground">
                      {entry.timestamp}
                    </TableCell>
                    <TableCell className="font-mono text-sm text-muted-foreground">
                      {entry.ipAddress}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-foreground">
                          {entry.city}, {entry.country}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {entry.device}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={statusConfig.className}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {statusConfig.label}
                      </Badge>
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
