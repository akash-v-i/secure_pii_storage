import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Lock, Shield, ArrowLeft } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

const piiSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters').max(100),
  email: z.string().email('Please enter a valid email address').max(255),
  phone: z.string().regex(/^\+?[\d\s\-()]{10,}$/, 'Please enter a valid phone number'),
  expiryDate: z.string().optional(),
});

type PIIFormData = z.infer<typeof piiSchema>;

export const AddPII: React.FC = () => {
  const navigate = useNavigate();
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<PIIFormData>({
    resolver: zodResolver(piiSchema),
  });

  const onSubmit = async (data: PIIFormData) => {
    // Simulate encryption and storage
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    toast.success('PII Record Encrypted & Stored', {
      description: 'Your personal information has been securely encrypted and saved.',
    });
    
    reset();
    navigate('/vault');
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Add New PII"
        description="Securely store your personal identifiable information"
        icon={Plus}
        actions={
          <Button variant="outline" onClick={() => navigate('/vault')} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Vault
          </Button>
        }
      />

      <div className="max-w-2xl">
        {/* Security Notice */}
        <div className="bg-secure-muted border border-secure/20 rounded-lg p-4 mb-6 flex items-start gap-3">
          <Shield className="w-5 h-5 text-secure flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-foreground">End-to-End Encryption</p>
            <p className="text-sm text-muted-foreground mt-1">
              Your data will be encrypted using AES-256 before storage. 
              Only you can decrypt and view this information.
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5" />
              Personal Information
            </CardTitle>
            <CardDescription>
              Enter the details you want to encrypt and store securely
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name *</Label>
                <Input
                  id="fullName"
                  placeholder="John Alexander Smith"
                  {...register('fullName')}
                  className={errors.fullName ? 'border-destructive' : ''}
                />
                {errors.fullName && (
                  <p className="text-sm text-destructive">{errors.fullName.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="john.smith@example.com"
                  {...register('email')}
                  className={errors.email ? 'border-destructive' : ''}
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+1 (555) 123-4567"
                  {...register('phone')}
                  className={errors.phone ? 'border-destructive' : ''}
                />
                {errors.phone && (
                  <p className="text-sm text-destructive">{errors.phone.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="expiryDate">
                  Expiry Date <span className="text-muted-foreground">(Optional)</span>
                </Label>
                <Input
                  id="expiryDate"
                  type="date"
                  {...register('expiryDate')}
                />
                <p className="text-xs text-muted-foreground">
                  Set an expiry date to automatically flag this record for deletion
                </p>
              </div>

              <div className="flex items-center gap-4 pt-4">
                <Button type="submit" size="lg" className="gap-2" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Lock className="w-4 h-4 animate-pulse" />
                      Encrypting...
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      Encrypt & Store
                    </>
                  )}
                </Button>
                <Button type="button" variant="outline" size="lg" onClick={() => reset()}>
                  Clear Form
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AddPII;
