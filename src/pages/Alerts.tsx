import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { vaultAPI } from '@/lib/api';
import { Bell, ShieldAlert, MapPin, UserX, Eye, Trash2, CheckCircle } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

interface Alert {
  id: string;
  type: 'new_ip' | 'failed_login' | 'pii_access' | 'expiry';
  title: string;
  description: string;
  timestamp: string;
  isRead: boolean;
  severity: 'info' | 'warning' | 'critical';
}


const getAlertIcon = (type: string) => {
  switch (type) {
    case 'new_ip':
      return MapPin;
    case 'failed_login':
      return UserX;
    case 'pii_access':
      return Eye;
    case 'expiry':
      return Trash2;
    default:
      return Bell;
  }
};

const getSeverityStyles = (severity: string) => {
  switch (severity) {
    case 'critical':
      return {
        badge: 'bg-destructive text-destructive-foreground',
        iconBg: 'bg-destructive/10',
        iconColor: 'text-destructive',
        border: 'border-l-destructive',
      };
    case 'warning':
      return {
        badge: 'bg-warning text-warning-foreground',
        iconBg: 'bg-warning/10',
        iconColor: 'text-warning',
        border: 'border-l-warning',
      };
    default:
      return {
        badge: 'bg-secondary text-secondary-foreground',
        iconBg: 'bg-secondary/10',
        iconColor: 'text-secondary',
        border: 'border-l-secondary',
      };
  }
};

export const Alerts: React.FC = () => {
  const { hasRole, isLoading: authLoading } = useAuth();

  // Redirect auditors
  if (!authLoading && hasRole(['auditor', 'admin'])) {
    return <Navigate to="/dashboard" replace />;
  }
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch alerts on mount
  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const data = await vaultAPI.getAlerts();
        setAlerts(data);
      } catch (error) {
        console.error('Failed to load alerts', error);
      } finally {
        setLoading(false);
      }
    };
    fetchAlerts();
  }, []);

  const unreadCount = alerts.filter(a => !a.isRead).length;

  const markAsRead = (id: string) => {
    setAlerts(alerts.map(a =>
      a.id === id ? { ...a, isRead: true } : a
    ));
  };

  const markAllAsRead = () => {
    setAlerts(alerts.map(a => ({ ...a, isRead: true })));
    toast.success('All alerts marked as read');
  };

  const deleteAlert = (id: string) => {
    setAlerts(alerts.filter(a => a.id !== id));
    toast.success('Alert dismissed');
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Security Alerts"
        description={`${unreadCount} unread alert${unreadCount !== 1 ? 's' : ''}`}
        icon={ShieldAlert}
        actions={
          unreadCount > 0 && (
            <Button variant="outline" onClick={markAllAsRead} className="gap-2">
              <CheckCircle className="w-4 h-4" />
              Mark All as Read
            </Button>
          )
        }
      />

      <div className="space-y-4">
        {alerts.map((alert) => {
          const Icon = getAlertIcon(alert.type);
          const styles = getSeverityStyles(alert.severity);

          return (
            <Card
              key={alert.id}
              className={cn(
                "border-l-4 transition-all duration-200",
                styles.border,
                !alert.isRead && "bg-muted/30"
              )}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className={cn("p-2.5 rounded-lg", styles.iconBg)}>
                    <Icon className={cn("w-5 h-5", styles.iconColor)} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className={cn(
                        "font-medium text-foreground",
                        !alert.isRead && "font-semibold"
                      )}>
                        {alert.title}
                      </h3>
                      {!alert.isRead && (
                        <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {alert.description}
                    </p>
                    <div className="flex items-center gap-3">
                      <Badge className={styles.badge} variant="secondary">
                        {alert.severity}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(alert.timestamp).toLocaleString('en-IN', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: true
                        })}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {!alert.isRead && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => markAsRead(alert.id)}
                      >
                        Mark as Read
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => deleteAlert(alert.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {alerts.length === 0 && (
          <div className="text-center py-16">
            <ShieldAlert className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground">No Security Alerts</h3>
            <p className="text-sm text-muted-foreground mt-1">
              You're all caught up! No security events to report.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Alerts;
