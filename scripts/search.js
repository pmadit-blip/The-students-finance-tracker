export function compileRegex(input, flags = 'i') {
  try {
    return input ? new RegExp(input, flags) : null;
  } catch {
	   return null;
  }
}

export function highlight(text, re) {
  if (!re) return escapeHtml(text);
  return escapeHtml(text).replace(re, m => `<mark>${m}`);
}

export function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&')
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/"/g, '"')
}

export function searchRecords(records, pattern, caseSensitive = false) {
  if (!pattern) return records;
  const flags = caseSensitive ? '' : 'i';
  const re = compileRegex(pattern, flags);
  if (!re) return [];
  return records.filter(r =>
    re.test(r.description) ||
    re.test(r.category) ||
    re.test(r.amount.toString()) ||
    re.test(r.date)
  );
}
