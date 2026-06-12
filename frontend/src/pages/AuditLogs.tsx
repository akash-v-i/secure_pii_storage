import React, { useState } from 'react';
import { FileSearch, Filter, Download, Shield } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { adminAPI } from '@/lib/api';

interface AuditLogEntry {
  id: string;
  eventType: string;
  user: string;
  timestamp: string;
  description: string;
}


const getEventTypeBadge = (eventType: string) => {
  const configs: Record<string, { label: string; className: string }> = {
    PII_ACCESS: { label: 'Access', className: 'bg-secondary/10 text-secondary border-secondary' },
    PII_CREATE: { label: 'Create', className: 'bg-secure/10 text-secure border-secure' },
    PII_DELETE: { label: 'Delete', className: 'bg-destructive/10 text-destructive border-destructive' },
    LOGIN_SUCCESS: { label: 'Login', className: 'bg-secure/10 text-secure border-secure' },
    LOGIN_FAILED: { label: 'Failed Login', className: 'bg-destructive/10 text-destructive border-destructive' },
    FILE_UPLOAD: { label: 'Upload', className: 'bg-secondary/10 text-secondary border-secondary' },
    FILE_DOWNLOAD: { label: 'Download', className: 'bg-secondary/10 text-secondary border-secondary' },
    SETTINGS_CHANGE: { label: 'Settings', className: 'bg-warning/10 text-warning border-warning' },
  };

  const config = configs[eventType] || { label: eventType, className: 'bg-muted text-muted-foreground' };

  return (
    <Badge variant="outline" className={config.className}>
      {config.label}
    </Badge>
  );
};

export const AuditLogs: React.FC = () => {
  const { hasRole } = useAuth();
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [eventFilter, setEventFilter] = useState('all');

  // Fetch logs on mount
  React.useEffect(() => {
    const fetchLogs = async () => {
      try {
        const data = await adminAPI.getAuditLogs();
        // Map backend data to frontend log format
        setLogs(data.map((log: any): AuditLogEntry => ({
          id: log.id.toString(),
          eventType: log.event_type || (log.success ? 'LOGIN_SUCCESS' : 'LOGIN_FAILED'),
          user: log.email,
          timestamp: new Date(log.timestamp).toLocaleString('en-IN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
          }),
          description: log.description || (log.success ? 'Successful authentication' : 'Failed login attempt')
        })));
      } catch (error) {
        console.error('Failed to load audit logs', error);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  // Role-based access check
  if (!hasRole(['admin', 'auditor'])) {
    return <Navigate to="/dashboard" replace />;
  }

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.user.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = eventFilter === 'all' || log.eventType === eventFilter;
    return matchesSearch && matchesFilter;
  });


  const handleExport = () => {
    if (filteredLogs.length === 0) return;

    const headers = ['Event Type', 'User', 'Timestamp', 'Description'];
    const rows = filteredLogs.map(log => [
      log.eventType,
      log.user,
      log.timestamp.replace(',', ''),
      `"${log.description.replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `audit-logs-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Audit Logs"
        description="Immutable record of all security-relevant events"
        icon={FileSearch}
        actions={
          <Button
            variant="outline"
            className="gap-2"
            onClick={handleExport}
            disabled={filteredLogs.length === 0}
          >
            <Download className="w-4 h-4" />
            Export Logs
          </Button>
        }
      />

      {/* Security Notice */}
      <div className="bg-muted border border-border rounded-lg p-4 mb-6 flex items-center gap-3">
        <Shield className="w-5 h-5 text-muted-foreground flex-shrink-0" />
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">Append-Only Log:</span> These records are immutable and cannot be modified or deleted.
          All entries are cryptographically signed and tamper-evident.
        </p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Input
            placeholder="Search logs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={eventFilter} onValueChange={setEventFilter}>
          <SelectTrigger className="w-48">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Filter by event" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Events</SelectItem>
            <SelectItem value="PII_ACCESS">PII Access</SelectItem>
            <SelectItem value="PII_CREATE">PII Create</SelectItem>
            <SelectItem value="PII_DELETE">PII Delete</SelectItem>
            <SelectItem value="LOGIN_SUCCESS">Login Success</SelectItem>
            <SelectItem value="LOGIN_FAILED">Login Failed</SelectItem>
            <SelectItem value="FILE_UPLOAD">File Upload</SelectItem>
            <SelectItem value="FILE_DOWNLOAD">File Download</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Logs Table */}
      <Card>
        <div className="overflow-hidden rounded-xl">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="font-semibold w-[150px]">Event Type</TableHead>
                <TableHead className="font-semibold w-[220px]">User</TableHead>
                <TableHead className="font-semibold w-[240px]">Timestamp</TableHead>
                <TableHead className="font-semibold">Description</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.map((log) => (
                <TableRow key={log.id} className="hover:bg-muted/30">
                  <TableCell className="py-4 w-[150px]">{getEventTypeBadge(log.eventType)}</TableCell>
                  <TableCell className="font-medium text-foreground py-4 w-[220px]">
                    <div className="truncate max-w-[200px]" title={log.user}>{log.user}</div>
                  </TableCell>
                  <TableCell className="font-mono text-[13px] text-muted-foreground py-4 w-[240px]">
                    {log.timestamp}
                  </TableCell>
                  <TableCell className="text-foreground py-4">
                    {log.description}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredLogs.length === 0 && (
            <div className="text-center py-12">
              <FileSearch className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">No audit logs found</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default AuditLogs;
