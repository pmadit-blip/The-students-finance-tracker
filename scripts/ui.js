function appendHighlightedText(target, value, pattern) {
  const text = String(value);

  if (!(pattern instanceof RegExp)) {
    target.textContent = text;
    return;
  }

  const regex = new RegExp(pattern.source, `${pattern.flags.replace(/[gy]/g, '')}g`);
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
      createCell(
        'Amount',
        new Intl.NumberFormat(undefined, {
          style: 'currency',
          currency
        }).format(Number(record.amount)),
        pattern
      ),
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

  const currency = elements.currency || 'USD';
  const amountFormat = new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency
  });

  if (elements.totalAmount) {
    elements.totalAmount.textContent = amountFormat.format(total);
  }

  if (elements.topCategory) {
    elements.topCategory.textContent = topCategory;
  }

  if (elements.budgetMessage) {
    const numericBudget = Number(budget);
    const budgetAmount = Number.isFinite(numericBudget)
      ? Math.max(numericBudget, 0)
      : 0;
    const remaining = budgetAmount - total;
    const exceeded = remaining < 0;
    const scaleMaximum = Math.max(budgetAmount, total, 1);

    elements.budgetMessage.classList.toggle('is-over-budget', exceeded);
    elements.budgetMessage.classList.toggle('is-within-budget', !exceeded);
    elements.budgetMessage.setAttribute(
      'aria-live',
      exceeded ? 'assertive' : 'polite'
    );
    elements.budgetMessage.textContent = exceeded
      ? `Budget exceeded by ${amountFormat.format(Math.abs(remaining))}.`
      : `${amountFormat.format(remaining)} remaining in your budget.`;

    let meter = elements.budgetMessage.parentElement.querySelector(
      '.budget-meter'
    );

    if (!meter) {
      meter = document.createElement('div');
      meter.className = 'budget-meter';

      const track = document.createElement('div');
      track.className = 'budget-meter__track';
      track.setAttribute('role', 'meter');

      const fill = document.createElement('span');
      fill.className = 'budget-meter__fill';

      const marker = document.createElement('span');
      marker.className = 'budget-meter__cap-marker';
      marker.setAttribute('aria-hidden', 'true');

      const label = document.createElement('p');
      label.className = 'budget-meter__label';

      track.append(fill, marker);
      meter.append(track, label);
      elements.budgetMessage.insertAdjacentElement('afterend', meter);
    }

    meter.classList.toggle('is-over-budget', exceeded);
    meter.classList.toggle('is-within-budget', !exceeded);

    const track = meter.querySelector('.budget-meter__track');
    const fill = meter.querySelector('.budget-meter__fill');
    const marker = meter.querySelector('.budget-meter__cap-marker');
    const label = meter.querySelector('.budget-meter__label');

    track.setAttribute('aria-label', 'Spending compared with budget cap');
    track.setAttribute('aria-valuemin', '0');
    track.setAttribute('aria-valuemax', String(scaleMaximum));
    track.setAttribute('aria-valuenow', String(total));
    track.setAttribute(
      'aria-valuetext',
      `${amountFormat.format(total)} spent; budget cap ${amountFormat.format(budgetAmount)}`
    );

    fill.style.width = `${Math.min((total / scaleMaximum) * 100, 100)}%`;
    marker.style.left = `${Math.min((budgetAmount / scaleMaximum) * 100, 100)}%`;
    label.textContent =
      `${amountFormat.format(total)} spent of ${amountFormat.format(budgetAmount)} budget`;
  }

  if (elements.trend) {
    renderSevenDayTrend(elements.trend, records, currency);
  }
}

function renderSevenDayTrend(container, records, currency) {
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
    const amount = totals[index];
    const label = new Intl.DateTimeFormat(undefined, {
      weekday: 'short'
    }).format(day);
    const bar = document.createElement('span');

    bar.className = 'trend-chart__bar';
    bar.style.height = `${Math.max((amount / maxTotal) * 100, 4)}%`;
    bar.setAttribute(
      'aria-label',
      `${label}: ${new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency
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
