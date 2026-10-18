export function compileRegex(input, flags = 'i') {
  try {
    return input ? new RegExp(input, flags) : null;
  } catch {
	   return null;
  }
}

export function highlight(text, re) {
  const value = String(text);
  if (!(re instanceof RegExp)) return escapeHtml(value);

  const regex = new RegExp(re.source, `${re.flags.replace(/[gy]/g, '')}g`);
  let output = '';
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(value)) !== null) {
    output += escapeHtml(value.slice(lastIndex, match.index));
    output += `<mark>${escapeHtml(match[0])}</mark>`;
    lastIndex = match.index + match[0].length;

    if (match[0].length === 0) regex.lastIndex += 1;
  }

  return output + escapeHtml(value.slice(lastIndex));
}

export function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
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