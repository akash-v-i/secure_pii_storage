import React from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
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
import { piiStore } from '@/stores/piiStore';
import { useAuth } from '@/contexts/AuthContext';

const PII_TYPES = [
  { value: 'aadhaar', label: 'Aadhaar Number' },
  { value: 'pan', label: 'PAN Card' },
  { value: 'mobile', label: 'Mobile/Phone Number' },
  { value: 'voter_id', label: 'Voter ID' },
  { value: 'driving_license', label: 'Driving License' },
  { value: 'passport', label: 'Passport Number' },
  { value: 'gstin', label: 'GSTIN' },
  { value: 'medical_data', label: 'Medical Records/ID' },
  { value: 'other', label: 'Other' },
] as const;

const piiSchema = z.object({
  piiType: z.string().min(1, 'Please select a PII type'),
  piiValue: z.string().min(1, 'PII value is required'),
  label: z.string().min(2, 'Label must be at least 2 characters').max(100, 'Label must be less than 100 characters'),
  notes: z.string().max(500, 'Notes must be less than 500 characters').optional(),
  expiryDate: z.string().optional(),
}).superRefine((data, ctx) => {
  const { piiType, piiValue } = data;

  if (piiType === 'other') return;

  let isValid = true;
  let message = 'Invalid format';
  const cleanValue = piiValue.trim();

  switch (piiType) {
    case 'aadhaar':
      // 12 digits, can have spaces or dashes: 1234-5678-9012 or 123456789012
      isValid = /^\d{4}[-\s]?\d{4}[-\s]?\d{4}$/.test(cleanValue);
      message = 'Invalid Aadhaar format. Expected 12 digits (e.g., 1234-5678-9012).';
      break;
    case 'pan':
      // 10 alphanumeric: ABCDE1234F
      isValid = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(cleanValue);
      message = 'Invalid PAN format. Expected 10 characters (e.g., ABCDE1234F).';
      break;
    case 'mobile':
      // 10 digits, optional +91 prefix
      isValid = /^(\+91[- ]?)?[6-9]\d{9}$/.test(cleanValue);
      message = 'Invalid Mobile Number. Expected 10 digits.';
      break;
    case 'voter_id':
      // 10 alphanumeric
      isValid = /^[A-Z0-9]{10}$/.test(cleanValue);
      message = 'Invalid Voter ID format. Expected 10 alphanumeric characters.';
      break;
    case 'driving_license':
      // 13-15 alphanumeric
      isValid = /^[A-Z0-9/\- ]{13,15}$/.test(cleanValue);
      message = 'Invalid Driving License format. Expected 13-15 characters.';
      break;
    case 'passport':
      // 8 alphanumeric
      isValid = /^[A-Z0-9]{8}$/.test(cleanValue);
      message = 'Invalid Passport Number. Expected 8 alphanumeric characters.';
      break;
    case 'gstin':
      // 15 alphanumeric
      isValid = /^[A-Z0-9]{15}$/.test(cleanValue);
      message = 'Invalid GSTIN format. Expected 15 alphanumeric characters.';
      break;
  }

  if (!isValid) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: message,
      path: ['piiValue'],
    });
  }
});

type PIIFormData = z.infer<typeof piiSchema>;

export const AddPII: React.FC = () => {
  const { hasRole, isLoading } = useAuth();
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

  // Redirect auditors away from Add PII
  if (!isLoading && hasRole(['auditor', 'admin'])) {
    return <Navigate to="/dashboard" replace />;
  }

  const selectedType = watch('piiType');

  const onSubmit = async (data: PIIFormData) => {
    try {
      const piiTypeInfo = PII_TYPES.find(t => t.value === data.piiType);
      const piiLabel = piiTypeInfo?.label || data.piiType;

      // Add to the backend via API
      await piiStore.addRecord({
        type: data.piiType,
        typeLabel: piiLabel,
        value: data.piiValue,
        label: data.label,
        notes: data.notes,
        expiryDate: data.expiryDate || undefined,
      });

      toast.success('PII Record Encrypted & Stored', {
        description: `Your ${piiLabel} has been securely encrypted and saved.`,
      });

      reset();
      navigate('/vault');
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { detail?: string } } };
      toast.error('Failed to store PII record', {
        description: axiosError.response?.data?.detail || 'Please try again.',
      });
    }
  };

  const getPlaceholderForType = (type: string): string => {
    switch (type) {
      case 'aadhaar': return '1234-5678-9012';
      case 'pan': return 'ABCDE1234F';
      case 'mobile': return '9876543210';
      case 'voter_id': return 'ABC1234567';
      case 'driving_license': return 'DL14C1234567890';
      case 'passport': return 'Z1234567';
      case 'gstin': return '22AAAAA0000A1Z5';
      case 'medical_data': return 'Policy #12345 or Medical History Summary';
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