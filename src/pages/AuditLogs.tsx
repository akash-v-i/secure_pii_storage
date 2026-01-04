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

interface AuditLogEntry {
  id: string;
  eventType: string;
  user: string;
  timestamp: string;
  description: string;
  ipAddress: string;
}

const mockAuditLogs: AuditLogEntry[] = [
  { id: '1', eventType: 'PII_ACCESS', user: 'admin', timestamp: '2024-01-15 14:30:25', description: 'Viewed SSN record', ipAddress: '192.168.1.45' },
  { id: '2', eventType: 'LOGIN_SUCCESS', user: 'user', timestamp: '2024-01-15 14:25:00', description: 'Successful authentication', ipAddress: '10.0.0.25' },
  { id: '3', eventType: 'PII_CREATE', user: 'admin', timestamp: '2024-01-15 12:00:00', description: 'Created new email record', ipAddress: '192.168.1.45' },
  { id: '4', eventType: 'FILE_UPLOAD', user: 'user', timestamp: '2024-01-15 11:45:00', description: 'Uploaded passport_scan.pdf', ipAddress: '10.0.0.25' },
  { id: '5', eventType: 'LOGIN_FAILED', user: 'unknown', timestamp: '2024-01-15 10:30:00', description: 'Failed login attempt', ipAddress: '172.16.0.100' },
  { id: '6', eventType: 'PII_DELETE', user: 'admin', timestamp: '2024-01-14 16:20:00', description: 'Deleted expired credit card record', ipAddress: '192.168.1.45' },
  { id: '7', eventType: 'SETTINGS_CHANGE', user: 'admin', timestamp: '2024-01-14 14:00:00', description: 'Updated retention policy', ipAddress: '192.168.1.45' },
  { id: '8', eventType: 'FILE_DOWNLOAD', user: 'auditor', timestamp: '2024-01-14 10:15:00', description: 'Downloaded tax_return_2023.pdf', ipAddress: '192.168.1.50' },
];

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
  const [searchQuery, setSearchQuery] = useState('');
  const [eventFilter, setEventFilter] = useState('all');

  // Role-based access check
  if (!hasRole(['admin', 'auditor'])) {
    return <Navigate to="/dashboard" replace />;
  }

  const filteredLogs = mockAuditLogs.filter(log => {
    const matchesSearch = log.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         log.user.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = eventFilter === 'all' || log.eventType === eventFilter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Audit Logs"
        description="Immutable record of all security-relevant events"
        icon={FileSearch}
        actions={
          <Button variant="outline" className="gap-2">
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
                <TableHead className="font-semibold">Event Type</TableHead>
                <TableHead className="font-semibold">User</TableHead>
                <TableHead className="font-semibold">Timestamp</TableHead>
                <TableHead className="font-semibold">Description</TableHead>
                <TableHead className="font-semibold">IP Address</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.map((log) => (
                <TableRow key={log.id} className="hover:bg-muted/30">
                  <TableCell>{getEventTypeBadge(log.eventType)}</TableCell>
                  <TableCell className="font-medium text-foreground">
                    {log.user}
                  </TableCell>
                  <TableCell className="font-mono text-sm text-muted-foreground">
                    {log.timestamp}
                  </TableCell>
                  <TableCell className="text-foreground">
                    {log.description}
                  </TableCell>
                  <TableCell className="font-mono text-sm text-muted-foreground">
                    {log.ipAddress}
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
