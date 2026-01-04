import React, { useState, useSyncExternalStore } from 'react';
import { Lock, Plus, Trash2, Search, Filter } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { SecureValueCell } from '@/components/common/SecureValueCell';
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
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { piiStore, PIIRecord } from '@/stores/piiStore';

export const Vault: React.FC = () => {
  const navigate = useNavigate();
  const records = useSyncExternalStore(piiStore.subscribe, piiStore.getRecords, piiStore.getRecords);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredRecords = records.filter(record =>
    record.typeLabel.toLowerCase().includes(searchQuery.toLowerCase()) ||
    record.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDelete = (id: string) => {
    piiStore.deleteRecord(id);
    toast.success('PII record deleted successfully', {
      description: 'The encrypted data has been permanently removed.',
    });
  };

  const handleReveal = (recordType: string) => {
    toast.info('Access logged', {
      description: `Your access to "${recordType}" has been recorded in the audit log.`,
    });
  };

  const isExpiringSoon = (expiryDate?: string) => {
    if (!expiryDate) return false;
    const expiry = new Date(expiryDate);
    const today = new Date();
    const diffDays = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays <= 30 && diffDays > 0;
  };

  const isExpired = (expiryDate?: string) => {
    if (!expiryDate) return false;
    return new Date(expiryDate) < new Date();
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="PII Vault"
        description="View and manage your encrypted personal information"
        icon={Lock}
        actions={
          <Button onClick={() => navigate('/add-pii')} className="gap-2">
            <Plus className="w-4 h-4" />
            Add PII Record
          </Button>
        }
      />

      {/* Search & Filter Bar */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by type..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button variant="outline" className="gap-2">
          <Filter className="w-4 h-4" />
          Filter
        </Button>
      </div>

      {/* Security Notice */}
      <div className="bg-secure-muted border border-secure/20 rounded-lg p-4 mb-6 flex items-center gap-3">
        <Lock className="w-5 h-5 text-secure flex-shrink-0" />
        <p className="text-sm text-foreground">
          <span className="font-medium">Encryption Active:</span> All values are encrypted at rest. 
          Clicking reveal will temporarily decrypt for 5 seconds and log the access.
        </p>
      </div>

      {/* PII Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="font-semibold">PII Type</TableHead>
              <TableHead className="font-semibold">Value (Encrypted)</TableHead>
              <TableHead className="font-semibold">Last Accessed</TableHead>
              <TableHead className="font-semibold">Expiry Date</TableHead>
              <TableHead className="font-semibold text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRecords.map((record) => (
              <TableRow key={record.id} className="hover:bg-muted/30">
                <TableCell>
                  <div className="flex flex-col gap-1">
                    <Badge variant="secondary" className="font-medium w-fit">
                      {record.typeLabel}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{record.label}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <SecureValueCell
                    value={record.value}
                    revealDuration={5}
                    onReveal={() => handleReveal(record.typeLabel)}
                  />
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {record.lastAccessed}
                </TableCell>
                <TableCell>
                  {record.expiryDate ? (
                    <Badge
                      variant={
                        isExpired(record.expiryDate)
                          ? 'destructive'
                          : isExpiringSoon(record.expiryDate)
                          ? 'outline'
                          : 'secondary'
                      }
                      className={
                        isExpiringSoon(record.expiryDate) && !isExpired(record.expiryDate)
                          ? 'border-warning text-warning'
                          : ''
                      }
                    >
                      {isExpired(record.expiryDate) ? 'Expired' : record.expiryDate}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground text-sm">No expiry</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete PII Record</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to permanently delete this encrypted record? 
                          This action cannot be undone and will be logged in the audit trail.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(record.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete Permanently
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        
        {filteredRecords.length === 0 && (
          <div className="text-center py-12">
            <Lock className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">No PII records found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Vault;
