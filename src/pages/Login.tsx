import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { Shield, Lock, User, RefreshCw, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

export const Login: React.FC = () => {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [captcha, setCaptcha] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const success = await login(username, password, captcha);
      if (success) {
        navigate('/dashboard');
      } else {
        setError('Invalid credentials or CAPTCHA. Please try again.');
      }
    } catch {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 gradient-header items-center justify-center p-12">
        <div className="max-w-md text-center">
          <div className="w-20 h-20 rounded-2xl gradient-secure mx-auto flex items-center justify-center mb-8 shadow-secure">
            <Shield className="w-10 h-10 text-secure-foreground" />
          </div>
          <h1 className="text-4xl font-bold text-primary-foreground mb-4">
            Secure PII Vault
          </h1>
          <p className="text-primary-foreground/70 text-lg leading-relaxed">
            Your personal information, protected with enterprise-grade encryption. 
            Access your sensitive data with confidence.
          </p>
          <div className="mt-12 flex items-center justify-center gap-8 text-primary-foreground/50">
            <div className="text-center">
              <div className="text-3xl font-bold text-secure">256-bit</div>
              <div className="text-sm">Encryption</div>
            </div>
            <div className="w-px h-12 bg-primary-foreground/20" />
            <div className="text-center">
              <div className="text-3xl font-bold text-secure">100%</div>
              <div className="text-sm">Privacy</div>
            </div>
            <div className="w-px h-12 bg-primary-foreground/20" />
            <div className="text-center">
              <div className="text-3xl font-bold text-secure">24/7</div>
              <div className="text-sm">Protected</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="w-16 h-16 rounded-xl gradient-secure mx-auto flex items-center justify-center mb-4">
              <Shield className="w-8 h-8 text-secure-foreground" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Secure PII Vault</h1>
          </div>

          <div className="bg-card rounded-2xl border border-border p-8 shadow-card">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/5 mb-4">
                <Lock className="w-6 h-6 text-primary" />
              </div>
              <h2 className="text-xl font-semibold text-foreground">Secure Login</h2>
              <p className="text-muted-foreground mt-1 text-sm">
                Enter your credentials to access your vault
              </p>
            </div>

            {error && (
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="username"
                    type="text"
                    placeholder="Enter username"
                    className="pl-10"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter password"
                    className="pl-10"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="captcha">Security Verification</Label>
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-muted rounded-lg px-4 py-3 font-mono text-lg tracking-widest text-center select-none">
                    SECURE
                  </div>
                  <Button type="button" variant="outline" size="icon" className="shrink-0">
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                </div>
                <Input
                  id="captcha"
                  type="text"
                  placeholder="Type the word above"
                  value={captcha}
                  onChange={(e) => setCaptcha(e.target.value)}
                  required
                />
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                size="lg"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Authenticating...
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    Login Securely
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t border-border">
              <p className="text-xs text-muted-foreground text-center">
                Demo credentials: <span className="font-mono">admin/admin123</span>, 
                <span className="font-mono"> user/user123</span>, or 
                <span className="font-mono"> auditor/auditor123</span>
              </p>
            </div>
          </div>

          <p className="text-center text-xs text-muted-foreground mt-6">
            Protected by 256-bit AES encryption
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
