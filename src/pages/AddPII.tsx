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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

const PII_TYPES = [
  { value: 'ssn', label: 'Social Security Number' },
  { value: 'passport', label: 'Passport Number' },
  { value: 'drivers_license', label: "Driver's License" },
  { value: 'credit_card', label: 'Credit Card Number' },
  { value: 'bank_account', label: 'Bank Account Number' },
  { value: 'medical_id', label: 'Medical ID' },
  { value: 'tax_id', label: 'Tax ID Number' },
  { value: 'other', label: 'Other Sensitive Data' },
] as const;

const piiSchema = z.object({
  piiType: z.string().min(1, 'Please select a PII type'),
  piiValue: z.string().min(1, 'PII value is required').max(500, 'Value must be less than 500 characters'),
  label: z.string().min(2, 'Label must be at least 2 characters').max(100, 'Label must be less than 100 characters'),
  notes: z.string().max(500, 'Notes must be less than 500 characters').optional(),
  expiryDate: z.string().optional(),
});

type PIIFormData = z.infer<typeof piiSchema>;

export const AddPII: React.FC = () => {
  const navigate = useNavigate();
  
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<PIIFormData>({
    resolver: zodResolver(piiSchema),
    defaultValues: {
      piiType: '',
      piiValue: '',
      label: '',
      notes: '',
      expiryDate: '',
    },
  });

  const selectedType = watch('piiType');

  const onSubmit = async (data: PIIFormData) => {
    // Simulate encryption and storage
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const piiLabel = PII_TYPES.find(t => t.value === data.piiType)?.label || data.piiType;
    
    toast.success('PII Record Encrypted & Stored', {
      description: `Your ${piiLabel} has been securely encrypted and saved.`,
    });
    
    reset();
    navigate('/vault');
  };

  const getPlaceholderForType = (type: string): string => {
    switch (type) {
      case 'ssn': return '***-**-****';
      case 'passport': return 'Passport number';
      case 'drivers_license': return 'License number';
      case 'credit_card': return '**** **** **** ****';
      case 'bank_account': return 'Account number';
      case 'medical_id': return 'Medical ID number';
      case 'tax_id': return 'Tax ID number';
      default: return 'Enter sensitive data';
    }
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
              Select the type of data and enter the sensitive information to encrypt
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="piiType">PII Type *</Label>
                <Select 
                  value={selectedType}
                  onValueChange={(value) => setValue('piiType', value, { shouldValidate: true })}
                >
                  <SelectTrigger className={errors.piiType ? 'border-destructive' : ''}>
                    <SelectValue placeholder="Select the type of data" />
                  </SelectTrigger>
                  <SelectContent>
                    {PII_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.piiType && (
                  <p className="text-sm text-destructive">{errors.piiType.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="piiValue">Sensitive Value *</Label>
                <Textarea
                  id="piiValue"
                  placeholder={getPlaceholderForType(selectedType)}
                  {...register('piiValue')}
                  className={`font-mono ${errors.piiValue ? 'border-destructive' : ''}`}
                  rows={3}
                />
                {errors.piiValue && (
                  <p className="text-sm text-destructive">{errors.piiValue.message}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Enter the actual sensitive data you want to encrypt
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="label">Label / Description *</Label>
                <Input
                  id="label"
                  placeholder="e.g., Personal SSN, Work Passport, Bank of America Checking"
                  {...register('label')}
                  className={errors.label ? 'border-destructive' : ''}
                />
                {errors.label && (
                  <p className="text-sm text-destructive">{errors.label.message}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  A friendly name to help you identify this record
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">
                  Notes <span className="text-muted-foreground">(Optional)</span>
                </Label>
                <Textarea
                  id="notes"
                  placeholder="Any additional notes about this data..."
                  {...register('notes')}
                  rows={2}
                />
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