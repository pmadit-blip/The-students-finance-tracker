const DESCRIPTION_RE = /^\S(?:.*\S)?$/;
const AMOUNT_RE = /^(0|[1-9]\d*)(\.\d{1,2})?$/;
const DATE_RE = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
const CATEGORY_RE = /^[A-Za-z]+(?:[ -][A-Za-z]+)*$/;
const DUPLICATE_WORD_RE = /\b(\w+)\s+\1\b/i;

export function validateDescription(value) {
	 if (!value.trim()) return 'Description is required';
  if (!DESCRIPTION_RE.test(value)) return 'Description must not have leading or trailing spaces';
  if (DUPLICATE_WORD_RE.test(value)) return 'Description contains duplicate consecutive words';
  return null;
}
export function validateAmount(value) {
  if (!value.toString().trim()) return 'Amount is required';
  if (!AMOUNT_RE.test(value.toString())) return 'Amount must be a valid positive number (e.g. 12.50)';
  return null;
}
export function validateDate(value) {
  if (!value.trim()) return 'Date is required';
  if (!DATE_RE.test(value)) return 'Date must be in YYYY-MM-DD format';
  return null;
}
export function validateCategory(value) {
  if (!value.trim()) return 'Category is required';
  if (!CATEGORY_RE.test(value)) return 'Category must contain only letters, spaces, or hyphens';
  return null;
}
export function validateRecord(record) {
  return {
	  description: validateDescription(record.description || ''),
    amount: validateAmount(record.amount || ''),
    date: validateDate(record.date || ''),
    category: validateCategory(record.category || '')
  };
}

export function hasErrors(errors) {
  return Object.values(errors).some(e => e !== null);
}
