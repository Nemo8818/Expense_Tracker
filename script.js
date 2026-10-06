// Expense Tracker: transactions are stored in this browser with localStorage.
const STORAGE_KEY = 'expense-tracker-transactions';

const form = document.querySelector('#transaction-form');
const descriptionInput = document.querySelector('#description');
const amountInput = document.querySelector('#amount');
const transactionList = document.querySelector('#transaction-list');
const emptyState = document.querySelector('#empty-state');
const clearAllButton = document.querySelector('#clear-all');
const totalIncomeElement = document.querySelector('#total-income');
const totalExpensesElement = document.querySelector('#total-expenses');
const currentBalanceElement = document.querySelector('#current-balance');
const transactionCountElement = document.querySelector('#transaction-count');

let transactions = loadTransactions();

function loadTransactions() {
  try {
    const savedTransactions = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    if (!Array.isArray(savedTransactions)) return [];

    // Ignore malformed saved entries so one bad value cannot break the page.
    return savedTransactions.filter((item) =>
      item && typeof item.id === 'string' && typeof item.description === 'string' &&
      Number.isFinite(item.amount) && item.amount > 0 &&
      (item.type === 'income' || item.type === 'expense')
    );
  } catch (error) {
    console.warn('Could not read saved transactions:', error);
    return [];
  }
}

function saveTransactions() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
  } catch (error) {
    console.warn('Could not save transactions:', error);
    alert('Your browser could not save this transaction. Check that local storage is available.');
  }
}

function formatCurrency(amount) {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(amount);
}

function formatDate(dateValue) {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return 'Date unavailable';
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).format(date);
}

function renderTransactions() {
  transactionList.replaceChildren();
  emptyState.hidden = transactions.length > 0;
  clearAllButton.disabled = transactions.length === 0;
  transactionCountElement.textContent = transactions.length;

  transactions.forEach((transaction) => {
    const item = document.createElement('li');
    item.className = `transaction-item ${transaction.type}`;

    const symbol = document.createElement('span');
    symbol.className = 'transaction-symbol';
    symbol.setAttribute('aria-hidden', 'true');
    symbol.textContent = transaction.type === 'income' ? '↙' : '↗';

    const details = document.createElement('div');
    details.className = 'transaction-details';
    const description = document.createElement('p');
    description.className = 'transaction-description';
    description.textContent = transaction.description;
    const meta = document.createElement('p');
    meta.className = 'transaction-meta';
    meta.textContent = `${transaction.type === 'income' ? 'Income' : 'Expense'} · ${formatDate(transaction.createdAt)}`;
    details.append(description, meta);

    const amount = document.createElement('p');
    amount.className = 'transaction-amount';
    amount.textContent = `${transaction.type === 'income' ? '+' : '−'}${formatCurrency(transaction.amount)}`;

    const deleteButton = document.createElement('button');
    deleteButton.className = 'delete-button';
    deleteButton.type = 'button';
    deleteButton.setAttribute('aria-label', `Delete ${transaction.description}`);
    deleteButton.title = 'Delete transaction';
    deleteButton.textContent = '×';
    deleteButton.addEventListener('click', () => deleteTransaction(transaction.id));

    item.append(symbol, details, amount, deleteButton);
    transactionList.append(item);
  });

  updateSummary();
}

function updateSummary() {
  const income = transactions.reduce((total, item) => total + (item.type === 'income' ? item.amount : 0), 0);
  const expenses = transactions.reduce((total, item) => total + (item.type === 'expense' ? item.amount : 0), 0);
  totalIncomeElement.textContent = formatCurrency(income);
  totalExpensesElement.textContent = formatCurrency(expenses);
  currentBalanceElement.textContent = formatCurrency(income - expenses);
}

function deleteTransaction(id) {
  transactions = transactions.filter((transaction) => transaction.id !== id);
  saveTransactions();
  renderTransactions();
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const description = descriptionInput.value.trim();
  const amount = Number(amountInput.value);
  const type = new FormData(form).get('type');

  if (!description || !Number.isFinite(amount) || amount <= 0) {
    form.reportValidity();
    return;
  }

  transactions.unshift({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    description,
    amount: Math.round(amount * 100) / 100,
    type,
    createdAt: new Date().toISOString()
  });
  saveTransactions();
  renderTransactions();
  form.reset();
  descriptionInput.focus();
});

clearAllButton.addEventListener('click', () => {
  if (transactions.length === 0) return;
  if (!window.confirm('Clear all transactions? This cannot be undone.')) return;
  transactions = [];
  saveTransactions();
  renderTransactions();
});

renderTransactions();
