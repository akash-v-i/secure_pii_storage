import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { adminAPI } from '@/lib/api';
import { Trash2, ShieldAlert } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

const DeletionRequests: React.FC = () => {
    const { hasRole, isLoading: authLoading } = useAuth();
    const [deletionRequests, setDeletionRequests] = useState<any[]>([]);
    const [selectedReason, setSelectedReason] = useState<string | null>(null);
    const [isReasonDialogOpen, setIsReasonDialogOpen] = useState(false);

    useEffect(() => {
        if (hasRole(['admin'])) {
            loadDeletionRequests();
        }
    }, [hasRole]);

    const loadDeletionRequests = async () => {
        try {
            const data = await adminAPI.getDeletionRequests();
            setDeletionRequests(data);
        } catch (err) {
            console.error(err);
            toast.error('Failed to load deletion requests');
        }
    };

    const handleUpdateDeletionRequest = async (requestId: number, status: string) => {
        try {
            await adminAPI.updateDeletionRequest(requestId, status);
            toast.success(`Request ${status} successfully`);
            loadDeletionRequests();
        } catch (err) {
            toast.error('Failed to update request');
        }
    };

    const handleViewReason = (reason: string) => {
        setSelectedReason(reason);
        setIsReasonDialogOpen(true);
    };

    if (!authLoading && !hasRole(['admin'])) {
        return <Navigate to="/dashboard" replace />;
    }

    return (
        <div className="animate-fade-in">
            <PageHeader
                title="Deletion Requests"
                description="Review and manage user account deletion requests"
                icon={Trash2}
            />

            <Card className="mt-8 border-warning/20">
                <CardHeader>
                    <CardTitle className="text-warning flex items-center gap-2">
                        <ShieldAlert className="w-5 h-5" /> Data Deletion Requests
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>User Email</TableHead>
                                <TableHead>Reason</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {deletionRequests.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                                        No deletion requests found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                deletionRequests.map((req) => (
                                    <TableRow key={req.id}>
                                        <TableCell className="font-medium">{req.user_email}</TableCell>
                                        <TableCell className="max-w-[300px]">
                                            <div className="flex flex-col gap-1">
                                                <p className="text-sm line-clamp-2 text-muted-foreground italic">
                                                    "{req.reason}"
                                                </p>
                                                <Button
                                                    variant="secondary"
                                                    size="sm"
                                                    className="w-fit h-7 px-2 text-[10px] uppercase tracking-wider"
                                                    onClick={() => handleViewReason(req.reason)}
                                                >
                                                    View Full Reason
                                                </Button>
                                            </div>
                                        </TableCell>
                                        <TableCell>{new Date(req.created_at).toLocaleDateString()}</TableCell>
                                        <TableCell>
                                            <Badge variant={req.status === 'pending' ? 'outline' : (req.status === 'approved' ? 'default' : (req.status === 'rejected' ? 'destructive' : 'secondary'))} className="capitalize">{req.status}</Badge>
                                        </TableCell>
                                        <TableCell className="text-right flex items-center justify-end gap-2">
                                            {req.status === 'pending' && (
                                                <>
                                                    <Button size="sm" variant="default" onClick={() => handleUpdateDeletionRequest(req.id, 'approved')}>
                                                        Approve
                                                    </Button>
                                                    <Button size="sm" variant="destructive" onClick={() => handleUpdateDeletionRequest(req.id, 'rejected')}>
                                                        Reject
                                                    </Button>
                                                </>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Dialog open={isReasonDialogOpen} onOpenChange={setIsReasonDialogOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Trash2 className="w-5 h-5 text-warning" />
                            Full Deletion Reason
                        </DialogTitle>
                        <DialogDescription>
                            Detailed justification provided by the user for data removal.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-6 whitespace-pre-wrap break-words border p-6 rounded-lg bg-muted/30 text-base leading-relaxed max-h-[500px] overflow-y-auto italic">
                        "{selectedReason}"
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsReasonDialogOpen(false)}>Close Window</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default DeletionRequests;
