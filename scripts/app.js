import { importJSON, exportJSON } from './storage.js';
import {
  addRecord,
  deleteRecord,
  getRecords,
  getSettings,
  replaceRecords,
  setSettings,
  updateRecord
} from './state.js';
import { hasErrors, validateRecord } from './validators.js';
import { compileRegex, searchRecords } from './search.js';
import { renderRecords, renderStats } from './ui.js';

const byId = id => {
  const element = document.getElementById(id);
  if (!element) throw new Error(`Required page element #${id} was not found`);
  return element;
};

const form = byId('record-form');
const descriptionInput = byId('description');
const amountInput = byId('amount');
const categoryInput = byId('category');
const dateInput = byId('date');
const recordsBody = byId('records-body');
const searchInput = byId('search-pattern');
const caseSensitiveInput = byId('case-sensitive');
const sortInput = byId('sort-by');
const status = byId('app-status');
const searchError = byId('search-error');
const budgetInput = byId('budget');
const currencyInput = byId('currency');
const importInput = byId('import-file');

let editingId = null;

function announce(message) {
  status.textContent = message;
}

function validateForm() {
  const errors = validateRecord({
    description: descriptionInput.value,
    amount: amountInput.value,
    category: categoryInput.value,
    date: dateInput.value
  });

  for (const [name, message] of Object.entries(errors)) {
    const input = byId(name);
    const errorElement = document.getElementById(`${name}-error`);

    input.setAttribute('aria-invalid', String(Boolean(message)));
    input.setCustomValidity(message || '');

    if (errorElement) errorElement.textContent = message || '';
  }

  return errors;
}

function sortRecords(records) {
  const [field, direction] = sortInput.value.split('-');
  const multiplier = direction === 'desc' ? -1 : 1;

  return [...records].sort((a, b) => {
    let result;

    if (field === 'amount') {
      result = Number(a.amount) - Number(b.amount);
    } else if (field === 'date') {
      result = a.date.localeCompare(b.date);
    } else {
      result = a.description.localeCompare(b.description);
    }

    return result * multiplier;
  });
}

function refresh() {
  const settings = getSettings();
  const pattern = searchInput.value;
  const flags = caseSensitiveInput.checked ? '' : 'i';
  const regex = compileRegex(pattern, flags);

  if (pattern && !regex) {
    searchError.textContent = 'Enter a valid regular expression.';
  } else {
    searchError.textContent = '';
  }

  const filtered = pattern && !regex
    ? []
    : searchRecords(getRecords(), pattern, !caseSensitiveInput.checked);

  renderRecords(recordsBody, sortRecords(filtered), {
    currency: currencyInput.value || settings.currency || 'USD',
    pattern: regex
  });

  renderStats({
    totalRecords: byId('total-records'),
    totalAmount: byId('total-amount'),
    topCategory: byId('top-category'),
    budgetMessage: byId('budget-message'),
    trend: byId('spending-trend'),
    currency: currencyInput.value || settings.currency || 'USD'
  }, getRecords(), Number(budgetInput.value));
}

function resetForm() {
  editingId = null;
  form.reset();
  form.querySelector('[type="submit"]').textContent = 'Add transaction';

  const cancelButton = document.getElementById('cancel-edit-button');
  if (cancelButton) cancelButton.hidden = true;

  for (const name of ['description', 'amount', 'category', 'date']) {
    const input = byId(name);
    input.setAttribute('aria-invalid', 'false');
    input.setCustomValidity('');

    const errorElement = document.getElementById(`${name}-error`);
    if (errorElement) errorElement.textContent = '';
  }
}

function startEditing(id) {
  const record = getRecords().find(item => item.id === id);
  if (!record) return;

  editingId = id;
  descriptionInput.value = record.description;
  amountInput.value = record.amount;
  categoryInput.value = record.category;
  dateInput.value = record.date;
  form.querySelector('[type="submit"]').textContent = 'Save changes';

  const cancelButton = document.getElementById('cancel-edit-button');
  if (cancelButton) cancelButton.hidden = false;

  descriptionInput.focus();
}

form.addEventListener('submit', event => {
  event.preventDefault();

  const errors = validateForm();
  if (hasErrors(errors)) {
    announce('Please correct the highlighted fields.');
    form.querySelector('[aria-invalid="true"]')?.focus();
    return;
  }

  const record = {
    description: descriptionInput.value,
    amount: Number(amountInput.value),
    category: categoryInput.value,
    date: dateInput.value
  };

  if (editingId) {
    updateRecord(editingId, record);
    announce('Transaction updated.');
  } else {
    addRecord(record);
    announce('Transaction added.');
  }

  resetForm();
  refresh();
});

recordsBody.addEventListener('click', event => {
  const button = event.target.closest('button[data-action][data-id]');
  if (!button) return;

  if (button.dataset.action === 'edit') {
    startEditing(button.dataset.id);
  } else if (button.dataset.action === 'delete') {
    const record = getRecords().find(item => item.id === button.dataset.id);
    if (!record || !window.confirm(`Delete "${record.description}"?`)) return;

    deleteRecord(record.id);
    announce('Transaction deleted.');
    refresh();
  }
});

document.getElementById('cancel-edit-button')?.addEventListener('click', resetForm);

for (const input of [searchInput, caseSensitiveInput, sortInput, currencyInput, budgetInput]) {
  input.addEventListener('input', refresh);
  input.addEventListener('change', refresh);
}

document.getElementById('settings-form')?.addEventListener('submit', event => {
  event.preventDefault();

  const budget = Number(budgetInput.value);
  if (!Number.isFinite(budget) || budget < 0) {
    announce('Enter a valid non-negative budget.');
    budgetInput.focus();
    return;
  }

  setSettings({ budget, currency: currencyInput.value });
  announce('Settings saved.');
  refresh();
});

document.getElementById('export-button')?.addEventListener('click', () => {
  exportJSON(getRecords());
  announce('Transactions exported.');
});

importInput.addEventListener('change', () => {
  const file = importInput.files?.[0];
  if (!file) return;

  importJSON(file, importedRecords => {
    try {
      replaceRecords(importedRecords);
      announce('Transactions imported.');
      refresh();
    } catch (error) {
      announce(`Import failed: ${error.message}`);
    } finally {
      importInput.value = '';
    }
  }, message => {
    announce(`Import failed: ${message}`);
    importInput.value = '';
  });
});

refresh();
