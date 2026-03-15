import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Lock,
  Plus,
  FileText,
  Bell,
  Clock,
  FileSearch,
  Settings,
  Shield,
  LogOut,
  Share2,
  Trash2
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  roles?: ('user' | 'admin' | 'auditor')[];
}

const navItems: NavItem[] = [
  { label: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={20} /> },
  { label: 'PII Vault', path: '/vault', icon: <Lock size={20} />, roles: ['user'] },
  { label: 'Add PII', path: '/add-pii', icon: <Plus size={20} />, roles: ['user'] },
  { label: 'Secure Files', path: '/files', icon: <FileText size={20} />, roles: ['user'] },
  { label: 'Alerts', path: '/alerts', icon: <Bell size={20} />, roles: ['user'] },
  { label: 'Login History', path: '/login-history', icon: <Clock size={20} />, roles: ['user'] },
  { label: 'Relationship Graph', path: '/graph', icon: <Share2 size={20} />, roles: ['user'] },
  { label: 'Admin Graph', path: '/admin-graph', icon: <Share2 size={20} />, roles: ['admin'] },
  { label: 'Audit Logs', path: '/audit-logs', icon: <FileSearch size={20} />, roles: ['admin', 'auditor'] },
  { label: 'Deletion Requests', path: '/admin/deletion-requests', icon: <Trash2 size={20} />, roles: ['admin'] },

  { label: 'Privacy', path: '/privacy', icon: <Settings size={20} />, roles: ['user'] },
];

export const AppSidebar: React.FC = () => {
  const { user, logout, hasRole } = useAuth();
  const location = useLocation();

  const filteredNavItems = navItems.filter(item => {
    if (!item.roles) return true;
    return hasRole(item.roles);
  });

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-secondary/20 text-secondary';
      case 'auditor': return 'bg-warning/20 text-warning';
      default: return 'bg-secure/20 text-secure';
    }
  };

  return (
    <aside className="w-64 min-h-screen bg-sidebar text-sidebar-foreground flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg gradient-secure flex items-center justify-center">
            <Shield className="w-6 h-6 text-secure-foreground" />
          </div>
          <div>
            <h1 className="font-semibold text-lg">PII Vault</h1>
            <p className="text-xs text-sidebar-foreground/60">Secure Storage</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {filteredNavItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200",
                isActive
                  ? "bg-sidebar-accent text-sidebar-primary"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              )
            }
          >
            {item.icon}
            <span className="text-sm font-medium">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* User Section */}
      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3 mb-4 px-2">
          <div className="w-9 h-9 rounded-full bg-sidebar-accent flex items-center justify-center">
            <span className="text-sm font-medium">{user?.username?.[0]?.toUpperCase()}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.username}</p>
            <span className={cn(
              "inline-block text-xs px-2 py-0.5 rounded-full capitalize",
              getRoleBadgeColor(user?.role || 'user')
            )}>
              {user?.role}
            </span>
          </div>
        </div>
        <Button
          variant="ghost"
          className="w-full justify-start text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
          onClick={logout}
        >
          <LogOut size={18} />
          <span>Logout</span>
        </Button>
      </div>
    </aside>
  );
};
