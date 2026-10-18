import {
  hasErrors,
  validateAmount,
  validateCategory,
  validateDate
} from './validators.js';

const KEY = 'app:data';
const SETTINGS_KEY = 'app:settings';
const DEFAULT_SETTINGS = {
  currency: 'USD',
  currencies: [
    { code: 'USD', rate: 1 },
    { code: 'EUR', rate: 0.92 },
    { code: 'KES', rate: 129.50 }
  ],
  budget: 500,
  categories: ['Food', 'Books', 'Transport', 'Entertainment', 'Fees', 'Other']
};

function parseStoredJSON(key, fallback, label) {
  const storedValue = localStorage.getItem(key);
  if (storedValue === null) return fallback;

  try {
    return JSON.parse(storedValue);
  } catch (error) {
    const detail = error instanceof Error ? ` ${error.message}` : '';
    throw new Error(`Saved ${label} in local storage is invalid JSON.${detail}`);
  }
}

export const load = () => parseStoredJSON(KEY, [], 'transactions');
export const save = data => localStorage.setItem(KEY, JSON.stringify(data));

export const loadSettings = () =>
  parseStoredJSON(SETTINGS_KEY, DEFAULT_SETTINGS, 'settings');
export const saveSettings = settings =>
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));

export const exportJSON = data => {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json'
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'finance-tracker.json';
  a.click();
  URL.revokeObjectURL(url);
};

export const importJSON = (file, onSuccess, onError) => {
  const reader = new FileReader();

  reader.onerror = () => onError('Could not read the selected file.');
  reader.onabort = () => onError('Reading the selected file was cancelled.');
  reader.onload = () => {
    let data;

    try {
      if (typeof reader.result !== 'string') {
        throw new Error('Could not read the file as text');
      }

      data = JSON.parse(reader.result);
      if (!Array.isArray(data)) {
        throw new Error('Invalid format: expected an array');
      }

      const ids = new Set();

      data.forEach((record, index) => {
        const label = `Record ${index + 1}`;

        if (!record || typeof record !== 'object' || Array.isArray(record)) {
          throw new Error(`${label} must be an object`);
        }
        if (typeof record.id !== 'string' || !record.id.trim()) {
          throw new Error(`${label} must have a non-empty id`);
        }
        if (ids.has(record.id)) {
          throw new Error(`Duplicate record id: ${record.id}`);
        }
        ids.add(record.id);
        if (
          typeof record.description !== 'string' ||
          typeof record.amount !== 'number' ||
          !Number.isFinite(record.amount) ||
          typeof record.category !== 'string' ||
          typeof record.date !== 'string'
        ) {
          throw new Error(`${label} has missing or invalid fields`);
        }

        if (
          typeof record.createdAt !== 'string' ||
          Number.isNaN(Date.parse(record.createdAt)) ||
          typeof record.updatedAt !== 'string' ||
          Number.isNaN(Date.parse(record.updatedAt))
        ) {
          throw new Error(`${label} has invalid timestamps`);
        }

        const errors = {
          description:
            !record.description.trim() ||
            record.description !== record.description.trim()
              ? 'Description is required and must not have leading or trailing spaces'
              : null,
          amount: validateAmount(record.amount),
          category: validateCategory(record.category),
          date: validateDate(record.date)
        };

        if (hasErrors(errors)) {
          throw new Error(`${label} has invalid values`);
        }
      });
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Invalid JSON file');
      return;
    }

    onSuccess(data);
  };

  reader.readAsText(file);
};
