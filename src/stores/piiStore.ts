// PII Store with API integration
import { vaultAPI } from '@/lib/api';

export interface PIIRecord {
  id: string | number;
  type: string;
  typeLabel: string;
  value: string;
  label: string;
  notes?: string;
  lastAccessed: string;
  expiryDate?: string;
}

// Cache for records (to avoid constant API calls)
let piiRecordsCache: PIIRecord[] = [];
let listeners: Set<() => void> = new Set();
let isLoaded = false;

// Convert API response to PIIRecord format
const convertToPIIRecord = (apiRecord: any): PIIRecord => {
  return {
    id: apiRecord.id,
    type: apiRecord.pii_type,
    typeLabel: apiRecord.type_label,
    value: apiRecord.value || '***', // Masked or decrypted value
    label: apiRecord.label,
    notes: apiRecord.notes,
    lastAccessed: apiRecord.last_accessed
      ? new Date(apiRecord.last_accessed).toISOString().replace('T', ' ').slice(0, 16)
      : '',
    expiryDate: apiRecord.expiry_date
      ? new Date(apiRecord.expiry_date).toISOString().split('T')[0]
      : undefined,
  };
};

const notifyListeners = () => {
  listeners.forEach(listener => listener());
};

export const piiStore = {
  // Load records from API
  loadRecords: async (): Promise<PIIRecord[]> => {
    try {
      const apiRecords = await vaultAPI.list();
      piiRecordsCache = apiRecords.map(convertToPIIRecord);
      isLoaded = true;
      notifyListeners();
      return piiRecordsCache;
    } catch (error) {
      console.error('Failed to load PII records:', error);
      isLoaded = false;
      return [];
    }
  },

  // Get records (use cache if loaded, otherwise return empty)
  getRecords: (): PIIRecord[] => {
    return piiRecordsCache;
  },

  // Add record via API
  addRecord: async (record: Omit<PIIRecord, 'id' | 'lastAccessed'>): Promise<PIIRecord> => {
    try {
      // Determine category from type
      const categoryMap: Record<string, string> = {
        'ssn': 'government_identifiers',
        'passport': 'government_identifiers',
        'drivers_license': 'government_identifiers',
        'credit_card': 'financial_info',
        'bank_account': 'financial_info',
        'medical_id': 'health_insurance',
        'tax_id': 'government_identifiers',
        'other': 'basic_identifiers',
      };

      const category = categoryMap[record.type] || 'basic_identifiers';

      const response = await vaultAPI.store({
        category,
        pii_type: record.type,
        type_label: record.typeLabel,
        value: record.value,
        label: record.label,
        notes: record.notes,
        expiry_date: record.expiryDate,
      });

      // Reload records to get the new one from server
      await piiStore.loadRecords();

      // Find the newly added record
      const newRecord = piiRecordsCache.find(r => r.id === response.id);
      return newRecord || convertToPIIRecord({ id: response.id, ...record });
    } catch (error) {
      console.error('Failed to add PII record:', error);
      throw error;
    }
  },

  // Delete record via API
  deleteRecord: async (id: string | number): Promise<void> => {
    try {
      await vaultAPI.delete(Number(id));
      // Update cache - filter returns new array, so this is correct
      piiRecordsCache = piiRecordsCache.filter(r => r.id !== id);
      notifyListeners();
    } catch (error) {
      console.error('Failed to delete PII record:', error);
      throw error;
    }
  },

  // Retrieve full decrypted value
  retrieveRecord: async (id: string | number): Promise<PIIRecord> => {
    try {
      const apiRecord = await vaultAPI.retrieve(Number(id));
      const decryptedRecord = convertToPIIRecord(apiRecord);

      // Update cache with decrypted value - CREATE NEW ARRAY REFERENCE
      const index = piiRecordsCache.findIndex(r => r.id === id);
      if (index !== -1) {
        const newCache = [...piiRecordsCache];
        newCache[index] = decryptedRecord;
        piiRecordsCache = newCache;
        notifyListeners();
      }

      return decryptedRecord;
    } catch (error) {
      console.error('Failed to retrieve PII record:', error);
      throw error;
    }
  },

  cleanupExpiredRecords: (): void => {
    const today = new Date().toISOString().split('T')[0];
    const initialCount = piiRecordsCache.length;
    piiRecordsCache = piiRecordsCache.filter(r => !r.expiryDate || r.expiryDate >= today);

    if (piiRecordsCache.length !== initialCount) {
      notifyListeners();
    }
  },

  getExpiringSoon: (days: number): PIIRecord[] => {
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + days);

    const todayStr = today.toISOString().split('T')[0];
    const futureStr = futureDate.toISOString().split('T')[0];

    return piiRecordsCache.filter(r => {
      if (!r.expiryDate) return false;
      return r.expiryDate > todayStr && r.expiryDate <= futureStr;
    });
  },

  subscribe: (listener: () => void): (() => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  // Reset cache (useful for logout)
  reset: (): void => {
    piiRecordsCache = [];
    isLoaded = false;
    notifyListeners();
  },
};
