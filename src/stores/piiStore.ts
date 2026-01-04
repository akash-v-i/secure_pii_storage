// Simple in-memory store for PII records (shared across components)

export interface PIIRecord {
  id: string;
  type: string;
  typeLabel: string;
  value: string;
  label: string;
  notes?: string;
  lastAccessed: string;
  expiryDate?: string;
}

const initialRecords: PIIRecord[] = [
  { id: '1', type: 'ssn', typeLabel: 'Social Security Number', value: '***-**-4567', label: 'Personal SSN', lastAccessed: '2024-01-15 14:30', expiryDate: '2025-01-15' },
  { id: '2', type: 'credit_card', typeLabel: 'Credit Card', value: '**** **** **** 1234', label: 'Visa Card', lastAccessed: '2024-01-14 09:15' },
  { id: '3', type: 'passport', typeLabel: 'Passport Number', value: 'AB1234567', label: 'US Passport', lastAccessed: '2024-01-10 11:00', expiryDate: '2024-12-31' },
];

// In-memory store
let piiRecords: PIIRecord[] = [...initialRecords];
let listeners: Set<() => void> = new Set();

export const piiStore = {
  getRecords: (): PIIRecord[] => [...piiRecords],
  
  addRecord: (record: Omit<PIIRecord, 'id' | 'lastAccessed'>): PIIRecord => {
    const newRecord: PIIRecord = {
      ...record,
      id: Date.now().toString(),
      lastAccessed: new Date().toISOString().replace('T', ' ').slice(0, 16),
    };
    piiRecords = [...piiRecords, newRecord];
    listeners.forEach(listener => listener());
    return newRecord;
  },
  
  deleteRecord: (id: string): void => {
    piiRecords = piiRecords.filter(r => r.id !== id);
    listeners.forEach(listener => listener());
  },
  
  subscribe: (listener: () => void): (() => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};
