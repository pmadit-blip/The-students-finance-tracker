function appendHighlightedText(target, value, pattern) {
  const text = String(value);

  if (!(pattern instanceof RegExp)) {
    target.textContent = text;
    return;
  }

  const flags = `${pattern.flags.replace(/[gy]/g, '')}g`;
  const regex = new RegExp(pattern.source, flags);
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    target.append(document.createTextNode(text.slice(lastIndex, match.index)));

    const mark = document.createElement('mark');
    mark.textContent = match[0];
    target.append(mark);

    lastIndex = match.index + match[0].length;

    if (match[0].length === 0) {
      regex.lastIndex += 1;
    }
  }

  target.append(document.createTextNode(text.slice(lastIndex)));
}

function createCell(label, value, pattern) {
  const cell = document.createElement('td');
  cell.dataset.label = label;

  if (pattern) {
    appendHighlightedText(cell, value, pattern);
  } else {
    cell.textContent = String(value);
  }

  return cell;
}

export function renderRecords(
  tbody,
  records,
  { currency = 'USD', pattern = null } = {}
) {
  if (!(tbody instanceof HTMLTableSectionElement)) {
    throw new TypeError('renderRecords requires a table body element');
  }

  const rows = records.map(record => {
    const row = document.createElement('tr');
    row.dataset.id = record.id;

    row.append(
      createCell('Description', record.description, pattern),
      createCell('Amount', new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency
      }).format(Number(record.amount)), pattern),
      createCell('Category', record.category, pattern),
      createCell('Date', record.date, pattern)
    );

    const actions = document.createElement('td');
    actions.dataset.label = 'Actions';

    const editButton = document.createElement('button');
    editButton.type = 'button';
    editButton.dataset.action = 'edit';
    editButton.dataset.id = record.id;
    editButton.setAttribute('aria-label', `Edit ${record.description}`);
    editButton.textContent = 'Edit';

    const deleteButton = document.createElement('button');
    deleteButton.type = 'button';
    deleteButton.dataset.action = 'delete';
    deleteButton.dataset.id = record.id;
    deleteButton.setAttribute('aria-label', `Delete ${record.description}`);
    deleteButton.textContent = 'Delete';

    actions.append(editButton, deleteButton);
    row.append(actions);

    return row;
  });

  tbody.replaceChildren(...rows);
}

export function renderStats(elements, records, budget = 500) {
  const total = records.reduce(
    (sum, record) => sum + Number(record.amount || 0),
    0
  );

  const categories = new Map();
  for (const record of records) {
    const category = record.category || 'Other';
    categories.set(category, (categories.get(category) || 0) + 1);
  }

  const topCategory = [...categories.entries()]
    .sort((a, b) => b[1] - a[1])[0]?.[0] || 'None';

  if (elements.totalRecords) {
    elements.totalRecords.textContent = String(records.length);
  }
  if (elements.totalAmount) {
    elements.totalAmount.textContent = new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: elements.currency || 'USD'
    }).format(total);
  }
  if (elements.topCategory) {
    elements.topCategory.textContent = topCategory;
  }

  if (elements.budgetMessage) {
    const remaining = Number(budget) - total;
    const exceeded = remaining < 0;

    elements.budgetMessage.setAttribute(
      'aria-live',
      exceeded ? 'assertive' : 'polite'
    );
    elements.budgetMessage.textContent = exceeded
      ? `Budget exceeded by ${new Intl.NumberFormat(undefined, {
          style: 'currency',
          currency: elements.currency || 'USD'
        }).format(Math.abs(remaining))}.`
      : `${new Intl.NumberFormat(undefined, {
          style: 'currency',
          currency: elements.currency || 'USD'
        }).format(remaining)} remaining in your budget.`;
  }

  if (elements.trend) {
    renderSevenDayTrend(elements.trend, records);
  }
}

function renderSevenDayTrend(container, records) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (6 - index));
    return date;
  });

  const totals = days.map(day => {
    const key = toDateKey(day);
    return records
      .filter(record => record.date === key)
      .reduce((sum, record) => sum + Number(record.amount || 0), 0);
  });

  const maxTotal = Math.max(...totals, 1);
  const chart = document.createElement('div');
  chart.className = 'trend-chart';
  chart.setAttribute('role', 'img');
  chart.setAttribute('aria-label', 'Spending over the last seven days');

  days.forEach((day, index) => {
    const bar = document.createElement('span');
    const amount = totals[index];
    const label = new Intl.DateTimeFormat(undefined, {
      weekday: 'short'
    }).format(day);

    bar.className = 'trend-chart__bar';
    bar.style.height = `${Math.max((amount / maxTotal) * 100, 4)}%`;
    bar.setAttribute(
      'aria-label',
      `${label}: ${new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: 'USD'
      }).format(amount)}`
    );
    bar.title = `${label}: ${amount.toFixed(2)}`;
    chart.append(bar);
  });

  container.replaceChildren(chart);
}

function toDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
