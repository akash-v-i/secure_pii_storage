import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/layout/AppLayout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Vault from "./pages/Vault";
import AddPII from "./pages/AddPII";
import Alerts from "./pages/Alerts";
import SecureFiles from "./pages/SecureFiles";
import LoginHistory from "./pages/LoginHistory";
import AuditLogs from "./pages/AuditLogs";
import Privacy from "./pages/Privacy";
import Graph from "./pages/Graph";
import AdminGraph from "./pages/AdminGraph";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/vault" element={<Vault />} />
              <Route path="/add-pii" element={<AddPII />} />
              <Route path="/files" element={<SecureFiles />} />
              <Route path="/alerts" element={<Alerts />} />
              <Route path="/login-history" element={<LoginHistory />} />
              <Route path="/audit-logs" element={<AuditLogs />} />
              <Route path="/graph" element={<Graph />} />
              <Route path="/admin-graph" element={<AdminGraph />} />
              <Route path="/privacy" element={<Privacy />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

// Auto-cleanup on app start
import { piiStore } from "@/stores/piiStore";
piiStore.cleanupExpiredRecords();

export default App;
