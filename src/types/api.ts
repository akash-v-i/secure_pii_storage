/**
 * API response types
 */

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: {
    id: number;
    email: string;
    username: string;
    role: string;
    lastLogin: string | null;
  };
}

export interface RegisterResponse {
  success: boolean;
  message: string;
  access_token?: string;
}

export interface PIIRecordResponse {
  id: number;
  category: string;
  pii_type: string;
  type_label: string;
  value: string;
  label: string;
  notes?: string;
  expiry_date?: string;
  last_accessed?: string;
  access_count: number;
  created_at: string;
  updated_at: string;
}

export interface PIIStoreRequest {
  category: string;
  pii_type: string;
  type_label: string;
  value: string;
  label: string;
  notes?: string;
  expiry_date?: string;
}
