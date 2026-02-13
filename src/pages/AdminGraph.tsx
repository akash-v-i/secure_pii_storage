import React, { useEffect, useState } from 'react';
import { Share2, Users, Search, Activity, Lock, ShieldAlert } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { adminAPI } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { UserGraphViewer } from '@/components/admin/UserGraphViewer';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export const UserGrader: React.FC = () => {
    const [users, setUsers] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedUser, setSelectedUser] = useState<any | null>(null);
    const [graphRecords, setGraphRecords] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isGraphLoading, setIsGraphLoading] = useState(false);

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        setIsLoading(true);
        try {
            const data = await adminAPI.listUsers();
            // Filter out admins
            const normalUsers = data.filter((u: any) => u.role !== 'admin');
            setUsers(normalUsers);
        } catch (error) {
            console.error("Failed to load users", error);
            toast.error("Failed to fetch user directory");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSelectUser = async (user: any) => {
        setSelectedUser(user);
        setIsGraphLoading(true);
        setGraphRecords([]);
        try {
            const records = await adminAPI.getUserGraph(user.id);
            setGraphRecords(records);
        } catch (error) {
            toast.error("Failed to load relationship graph");
        } finally {
            setIsGraphLoading(false);
        }
    };

    const filteredUsers = users.filter(u =>
        u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="animate-fade-in flex flex-col h-full space-y-6 pb-6 pt-2">
            <PageHeader
                title="Admin Relationship Insights"
                description="Monitor user-specific data correlation surfaces and PII risk gradients."
                icon={Share2}
            />

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
                {/* User Selection Sidebar */}
                <div className="xl:col-span-4 space-y-6">
                    <Card className="rounded-[2.5rem] border border-border/60 shadow-xl overflow-hidden">
                        <CardHeader className="pb-3 px-6 pt-6">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Users className="w-5 h-5 text-primary" />
                                User Directory
                            </CardTitle>
                            <div className="relative mt-2">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search users..."
                                    className="pl-10 rounded-xl bg-muted/50 border-border/50"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </CardHeader>
                        <CardContent className="px-2 pb-2">
                            <div className="max-h-[60vh] overflow-y-auto custom-scrollbar">
                                <Table>
                                    <TableHeader className="sr-only">
                                        <TableRow>
                                            <TableHead>User</TableHead>
                                            <TableHead className="text-right">Action</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredUsers.length > 0 ? (
                                            filteredUsers.map((u) => (
                                                <TableRow
                                                    key={u.id}
                                                    className={`group cursor-pointer border-0 ${selectedUser?.id === u.id ? 'bg-primary/5' : 'hover:bg-muted/50'}`}
                                                    onClick={() => handleSelectUser(u)}
                                                >
                                                    <TableCell className="py-4 pl-6">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                                                {u.username[0].toUpperCase()}
                                                            </div>
                                                            <div>
                                                                <p className="font-semibold text-sm">{u.username}</p>
                                                                <p className="text-xs text-muted-foreground">{u.email}</p>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-right pr-6">
                                                        <Badge variant="secondary" className="font-mono text-[10px]">
                                                            {u.pii_count || 0}
                                                        </Badge>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={2} className="text-center py-10 text-muted-foreground">
                                                    {isLoading ? "Synchronizing..." : "No users found"}
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>

                    {selectedUser && (
                        <Card className="rounded-[2.5rem] border border-border/60 bg-primary shadow-xl text-primary-foreground">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="p-2 bg-white/10 rounded-lg">
                                        <Activity className="w-5 h-5" />
                                    </div>
                                    <Badge variant="outline" className="border-white/20 text-white font-mono">
                                        UID: {selectedUser.id}
                                    </Badge>
                                </div>
                                <h4 className="text-lg font-bold mb-1">{selectedUser.username}</h4>
                                <p className="text-sm text-primary-foreground/75 mb-4">
                                    Last Active: {selectedUser.last_login ? new Date(selectedUser.last_login).toLocaleDateString() : 'Never'}
                                </p>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
                                        <p className="text-[10px] uppercase font-black opacity-50">Records</p>
                                        <p className="text-xl font-bold">{selectedUser.pii_count || 0}</p>
                                    </div>
                                    <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
                                        <p className="text-[10px] uppercase font-black opacity-50">Role</p>
                                        <p className="text-xl font-bold capitalize">{selectedUser.role}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Graph Area */}
                <div className="xl:col-span-8">
                    {selectedUser ? (
                        <div className="space-y-6">
                            {isGraphLoading ? (
                                <Card className="h-[650px] rounded-[2.5rem] flex items-center justify-center border border-border/50 bg-muted/20">
                                    <div className="flex flex-col items-center gap-4">
                                        <Activity className="w-10 h-10 animate-spin text-primary/30" />
                                        <p className="text-sm font-bold text-muted-foreground animate-pulse uppercase tracking-[0.2em]">Resolving Neural Map...</p>
                                    </div>
                                </Card>
                            ) : (
                                <UserGraphViewer
                                    records={graphRecords}
                                    username={selectedUser.username}
                                />
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Card className="p-5 rounded-3xl border border-border/50 bg-card shadow-sm">
                                    <div className="flex items-center gap-3 mb-2">
                                        <ShieldAlert className="w-4 h-4 text-warning" />
                                        <h5 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Admin Protocol</h5>
                                    </div>
                                    <p className="text-[11px] text-muted-foreground leading-relaxed italic">
                                        All visualized nodes represent metadata. Actual PII values remain encrypted and are mathematically unreachable through this administrative view.
                                    </p>
                                </Card>
                                <Card className="p-5 rounded-3xl border border-border/50 bg-card shadow-sm">
                                    <div className="flex items-center gap-3 mb-2">
                                        <Lock className="w-4 h-4 text-primary" />
                                        <h5 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Privacy Guard</h5>
                                    </div>
                                    <p className="text-[11px] text-muted-foreground leading-relaxed italic">
                                        Graph connections are derived from category types and sharing frequencies to identify over-exposure risks without decrypting content.
                                    </p>
                                </Card>
                            </div>
                        </div>
                    ) : (
                        <Card className="h-[650px] rounded-[3rem] border-2 border-dashed border-border/60 flex items-center justify-center bg-muted/10">
                            <div className="flex flex-col items-center gap-6 text-center max-w-sm px-6">
                                <div className="p-8 rounded-full bg-muted/50 border border-border/50 shadow-inner">
                                    <Share2 className="w-12 h-12 text-muted-foreground/30 animate-pulse" />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-xl font-bold text-foreground">Select a User Profile</h3>
                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                        Navigate the directory on the left to initialize a relationship graph analysis for specific user identity surfaces.
                                    </p>
                                </div>
                            </div>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UserGrader;
