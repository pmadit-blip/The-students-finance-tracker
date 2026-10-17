# Student Finance Tracker

A responsive student finance tracker built with vanilla HTML, CSS and JavaScript ES modules. Use it to record transactions, review spending and keep an eye on a budget.

**Repository:** [pmadit-blip/The-students-finance-tracker](https://github.com/pmadit-blip/The-students-finance-tracker)

## Features

- Add, edit and delete transactions.
- Search descriptions, amounts, categories and dates with regular expressions.
- Sort transactions by date, description, or amount.
- View transaction totals, total spending, the top category and a seven-day spending chart.
- Set a budget cap and see remaining budget or overage.
- Save transactions and settings in browser local storage.
- Import and export transactions as JSON.
- Choose a display currency. Currency selection changes the display format; it does not convert amounts using exchange rates.
- Use the responsive layout with keyboard navigation, visible focus and live status messages.

## Data model

Each transaction has a unique ID and timestamps, along with its description, amount, category and date:

```json
{
  "id": "txn_0001",
  "description": "Lunch at cafeteria",
  "amount": 12.5,
  "category": "Food",
  "date": "2025-09-25",
  "createdAt": "2025-09-25T10:30:00.000Z",
  "updatedAt": "2025-09-25T10:30:00.000Z"
}
```

Sample records are provided in [`seed.json`](./seed.json).

## Validation and regex search

The transaction form uses regular expressions to validate its fields:

| Field | Pattern | Purpose |
| --- | --- | --- |
| Description | `/^\S(?:.*\S)?$/` | Disallows leading and trailing whitespace. |
| Amount | `/^(0\|[1-9]\d*)(\.\d{1,2})?$/` | Accepts a non-negative number with up to two decimal places. |
| Date | `/^\d{4}-(0[1-9]\|1[0-2])-(0[1-9]\|[12]\d\|3[01])$/` | Checks the `YYYY-MM-DD` format. |
| Category | `/^[A-Za-z]+(?:[ -][A-Za-z]+)*$/` | Allows words separated by spaces or hyphens. |
| Repeated words | `/\b(\w+)\s+\1\b/i` | Detects consecutive duplicate words in a description. |

Search accepts a JavaScript regular expression. Examples:

- `coffee|tea` — finds either word; search is case-insensitive by default.
- `\b(\w+)\s+\1\b` — finds consecutive repeated words.
- `.\d{2}\b` — finds text with two digits at the end, such as cents.

Invalid search expressions are reported instead of being applied.

## Accessibility

- Semantic landmarks and a logical heading structure support screen-reader navigation.
- Form fields have associated labels, and validation messages are associated with their inputs.
- Keyboard focus is visible, and a skip link moves directly to the main content.
- Status updates and search errors are announced using live regions.
- On narrow screens, transaction rows are presented as labeled cards.
- Reduced-motion preferences are respected.

## Keyboard navigation

- `Tab` and `Shift+Tab` move between links, form fields, and buttons.
- `Enter` activates links and buttons; `Space` activates buttons and toggles checkboxes.
- The first focusable link, **Skip to main content**, skips the header and navigation.

## Run locally

The app has no package installation or build step. Clone the repository, then serve its root directory using a local static web server. For example, with Python installed:

```bash
python -m http.server 8000
```

Open <http://localhost:8000/> in a browser. Serving the files locally is recommended because the app uses JavaScript ES modules and browser local storage.

## Run the tests

With the local server running, open <http://localhost:8000/tests.html> to view the validation and search checks.

## Publish with GitHub Pages

In the repository, open **Settings → Pages**, select the `master` branch and `/ (root)` as the publishing source, then save. After GitHub Pages finishes deploying, the site should be available at:

<https://pmadit-blip.github.io/The-students-finance-tracker/>

## About and contact

Created by [pmadit-blip](https://github.com/pmadit-blip). You can contact me through my GitHub profile.

## Demo video
{WILL AVAILABLE SOON}
