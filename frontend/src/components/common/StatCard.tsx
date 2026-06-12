import React from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  variant?: 'default' | 'secure' | 'warning' | 'destructive';
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = 'default',
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'secure':
        return {
          iconBg: 'bg-secure/10',
          iconColor: 'text-secure',
        };
      case 'warning':
        return {
          iconBg: 'bg-warning/10',
          iconColor: 'text-warning',
        };
      case 'destructive':
        return {
          iconBg: 'bg-destructive/10',
          iconColor: 'text-destructive',
        };
      default:
        return {
          iconBg: 'bg-secondary/10',
          iconColor: 'text-secondary',
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <div className="bg-card rounded-xl border border-border p-6 shadow-card animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground font-medium">{title}</p>
          <p className="text-3xl font-semibold mt-2 text-foreground">{value}</p>
          {subtitle && (
            <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
          )}
        </div>
        <div className={cn("p-3 rounded-lg", styles.iconBg)}>
          <Icon className={cn("w-6 h-6", styles.iconColor)} />
        </div>
      </div>
    </div>
  );
};
