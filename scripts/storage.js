const KEY = 'app:data';
const SETTINGS_KEY = 'app:settings';

export const load = () => JSON.parse(localStorage.getItem(KEY) || '[]');
export const save = data => localStorage.setItem(KEY, JSON.stringify(data));

export const loadSettings = () => JSON.parse(localStorage.getItem(SETTINGS_KEY) || JSON.stringify({
  currency: 'USD',
  currencies: [
    { code: 'USD', rate: 1 },
    { code: 'EUR', rate: 0.92 },
    { code: 'KES', rate: 129.50 }

	  ],
  budget: 500,
  categories: ['Food', 'Books', 'Transport', 'Entertainment', 'Fees', 'Other']
}));
export const saveSettings = settings => localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));

export const exportJSON = data => {
	const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
	a.download = 'finance-tracker.json';
  a.click();
  URL.revokeObjectURL(url);
	};

export const importJSON = (file, onSuccess, onError) => {
  const reader = new FileReader();
	reader.onload = e => {
    try {
      const data = JSON.parse(e.target.result);
	     if (!Array.isArray(data)) throw new Error('Invalid format: expected an array');
      const valid = data.every(r => r.id && r.description && r.amount !== undefined && r.category && r.date);
      if (!valid) throw new Error('Invalid format: missing required fields');
      onSuccess(data);
    } catch (err) {
      onError(err.message);
    }
  };
  reader.readAsText(file);
};
