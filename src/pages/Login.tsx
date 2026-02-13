import React, { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { Shield, Lock, User, RefreshCw, AlertCircle, Mail, UserPlus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { SecurityDemoModal } from '@/components/Login/SecurityDemoModal';
import { authAPI } from '@/lib/api';

export const Login: React.FC = () => {
  const { login, register, isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [captcha, setCaptcha] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ name?: string; email?: string; password?: string; confirmPassword?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [captchaData, setCaptchaData] = useState<{ text: string; id: string | null }>({ text: 'SECURE', id: null });

  const refreshCaptcha = async () => {
    try {
      const data = await authAPI.getCaptcha();
      setCaptchaData({ text: data.captcha, id: data.captcha_id });
    } catch (err) {
      console.error('Failed to fetch captcha:', err);
    }
  };

  useEffect(() => {
    if (!isRegisterMode) {
      refreshCaptcha();
    }
  }, [isRegisterMode]);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string): { valid: boolean; message?: string } => {
    if (password.length < 8) {
      return { valid: false, message: 'Password must be at least 8 characters' };
    }
    if (!/[A-Z]/.test(password)) {
      return { valid: false, message: 'Password must contain at least one uppercase letter' };
    }
    if (!/[a-z]/.test(password)) {
      return { valid: false, message: 'Password must contain at least one lowercase letter' };
    }
    if (!/[0-9]/.test(password)) {
      return { valid: false, message: 'Password must contain at least one number' };
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      return { valid: false, message: 'Password must contain at least one special character (!@#$%^&*...)' };
    }
    return { valid: true };
  };

  const validateForm = (): boolean => {
    const errors: { name?: string; email?: string; password?: string; confirmPassword?: string } = {};

    if (isRegisterMode && name.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters';
    }

    if (!validateEmail(email)) {
      errors.email = 'Please enter a valid email address (e.g., user@domain.com)';
    }

    const passwordCheck = validatePassword(password);
    if (!passwordCheck.valid) {
      errors.password = passwordCheck.message;
    }

    if (isRegisterMode && password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Show loading state while checking authentication
  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setFieldErrors({});

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      if (isRegisterMode) {
        const result = await register(email, password, name);
        if (result.success) {
          setSuccess('Account created successfully! You can now log in.');
          setIsRegisterMode(false);
          setPassword('');
          setConfirmPassword('');
          setCaptcha('');
        } else {
          setError(result.message || 'Registration failed. Please try again.');
        }
      } else {
        const success = await login(email, password, captcha, captchaData.id || undefined);
        if (success) {
          navigate('/dashboard');
        } else {
          setError('Invalid credentials or CAPTCHA. Please try again.');
          refreshCaptcha();
        }
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleMode = () => {
    setIsRegisterMode(!isRegisterMode);
    setError('');
    setSuccess('');
    setFieldErrors({});
    setPassword('');
    setConfirmPassword('');
    setCaptcha('');
  };

  return (
    <div className="min-h-screen lg:h-screen w-full lg:overflow-hidden bg-background flex flex-col lg:flex-row">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 gradient-header items-center justify-center p-12 lg:overflow-y-auto">
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
          <div className="mt-16 animate-pulse-secure">
            <SecurityDemoModal />
          </div>
        </div>
      </div>

      {/* Right Panel - Login/Register Form */}
      <div className="flex-1 flex items-center justify-center p-8 overflow-y-auto">
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
                {isRegisterMode ? <UserPlus className="w-6 h-6 text-primary" /> : <Lock className="w-6 h-6 text-primary" />}
              </div>
              <h2 className="text-xl font-semibold text-foreground">
                {isRegisterMode ? 'Create Account' : 'Secure Login'}
              </h2>
              <p className="text-muted-foreground mt-1 text-sm">
                {isRegisterMode ? 'Register to create your secure vault' : 'Enter your credentials to access your vault'}
              </p>
            </div>

            {error && (
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="mb-6 border-green-500 bg-green-50 text-green-800">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {isRegisterMode && (
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="name"
                      type="text"
                      placeholder="Enter your full name"
                      className={`pl-10 ${fieldErrors.name ? 'border-destructive' : ''}`}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
                  {fieldErrors.name && (
                    <p className="text-sm text-destructive">{fieldErrors.name}</p>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter email"
                    className={`pl-10 ${fieldErrors.email ? 'border-destructive' : ''}`}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                {fieldErrors.email && (
                  <p className="text-sm text-destructive">{fieldErrors.email}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Min 8 chars, upper, lower, number, special"
                    className={`pl-10 ${fieldErrors.password ? 'border-destructive' : ''}`}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                {fieldErrors.password && (
                  <p className="text-sm text-destructive">{fieldErrors.password}</p>
                )}
              </div>

              {isRegisterMode && (
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="Re-enter your password"
                      className={`pl-10 ${fieldErrors.confirmPassword ? 'border-destructive' : ''}`}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                  </div>
                  {fieldErrors.confirmPassword && (
                    <p className="text-sm text-destructive">{fieldErrors.confirmPassword}</p>
                  )}
                </div>
              )}

              {!isRegisterMode && (
                <div className="space-y-2">
                  <Label htmlFor="captcha">Security Verification</Label>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 bg-muted rounded-lg px-4 py-3 font-mono text-lg tracking-widest text-center select-none relative overflow-hidden group">
                      <div className="absolute inset-0 opacity-10 pointer-events-none select-none">
                        <div className="absolute top-1/2 left-0 w-full h-[1px] bg-foreground -rotate-6" />
                        <div className="absolute top-1/3 left-0 w-full h-[1px] bg-foreground rotate-3" />
                      </div>
                      <span className="relative z-10">{captchaData.text}</span>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="shrink-0"
                      onClick={(e) => {
                        e.preventDefault();
                        refreshCaptcha();
                      }}
                    >
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
              )}

              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    {isRegisterMode ? 'Creating Account...' : 'Authenticating...'}
                  </>
                ) : (
                  <>
                    {isRegisterMode ? <UserPlus className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                    {isRegisterMode ? 'Create Account' : 'Login Securely'}
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t border-border text-center">
              <p className="text-sm text-muted-foreground">
                {isRegisterMode ? 'Already have an account?' : "Don't have an account?"}
                <Button
                  variant="link"
                  className="px-1 text-primary"
                  onClick={toggleMode}
                >
                  {isRegisterMode ? 'Login' : 'Register'}
                </Button>
              </p>
            </div>

            {!isRegisterMode && (
              <div className="mt-4 pt-4 border-t border-border flex flex-col items-center gap-3">
                <SecurityDemoModal />
                <p className="text-[10px] text-muted-foreground text-center">
                  Demo: <span className="font-mono">admin@vault.com/Admin123!</span>,
                  <span className="font-mono"> user@vault.com/User1234!</span>
                </p>
              </div>
            )}
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
