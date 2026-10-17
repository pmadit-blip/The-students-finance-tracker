import {
  load,
  save,
  loadSettings,
  saveSettings
} from './storage.js';

let records = load();
let settings = loadSettings();

function createId() {
  return `txn_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function copyRecord(record) {
  return { ...record };
}

function validateRecords(value) {
  if (!Array.isArray(value)) {
    throw new TypeError('Records must be an array');
  }

  const ids = new Set();

  for (const record of value) {
    if (!record || typeof record !== 'object' || Array.isArray(record)) {
      throw new TypeError('Each record must be an object');
    }
    if (typeof record.id !== 'string' || !record.id.trim()) {
      throw new TypeError('Each record must have a non-empty id');
    }
    if (ids.has(record.id)) {
      throw new Error(`Duplicate record id: ${record.id}`);
    }
    ids.add(record.id);
  }

  return value.map(copyRecord);
}

export function getRecords() {
  return records.map(copyRecord);
}

export function replaceRecords(nextRecords) {
  const validatedRecords = validateRecords(nextRecords);
  save(validatedRecords);
  records = validatedRecords;
  return getRecords();
}

export function addRecord(record) {
  if (!record || typeof record !== 'object' || Array.isArray(record)) {
    throw new TypeError('Record must be an object');
  }

  const timestamp = new Date().toISOString();
  const newRecord = {
    ...record,
    id: createId(),
    createdAt: timestamp,
    updatedAt: timestamp
  };

  const nextRecords = [...records, newRecord];
  save(nextRecords);
  records = nextRecords;
  return copyRecord(newRecord);
}

export function updateRecord(id, changes) {
  const existingRecord = records.find(record => record.id === id);
  if (!existingRecord) return null;

  const updatedRecord = {
    ...existingRecord,
    ...changes,
    id: existingRecord.id,
    createdAt: existingRecord.createdAt,
    updatedAt: new Date().toISOString()
  };

  const nextRecords = records.map(record =>
    record.id === id ? updatedRecord : record
  );

  save(nextRecords);
  records = nextRecords;
  return copyRecord(updatedRecord);
}

export function deleteRecord(id) {
  const nextRecords = records.filter(record => record.id !== id);
  if (nextRecords.length === records.length) return false;

  save(nextRecords);
  records = nextRecords;
  return true;
}

export function getSettings() {
  return {
    ...settings,
    categories: [...(settings.categories || [])],
    currencies: (settings.currencies || []).map(currency => ({ ...currency }))
  };
}

export function setSettings(updates) {
  if (!updates || typeof updates !== 'object' || Array.isArray(updates)) {
    throw new TypeError('Settings updates must be an object');
  }

  const nextSettings = { ...settings, ...updates };
  saveSettings(nextSettings);
  settings = nextSettings;
  return getSettings();
}
