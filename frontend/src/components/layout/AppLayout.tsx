import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { AppSidebar } from './AppSidebar';
import { useAuth } from '@/contexts/AuthContext';

export const AppLayout: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  // Wait for auth initialization to complete before checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex h-full overflow-hidden bg-background">
      <AppSidebar />
      <main className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden">
        <div className="p-8 min-h-full max-w-full">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
