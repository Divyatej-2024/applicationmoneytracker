const STORAGE_KEY = 'money-tracker-transactions';
const GOAL_KEY = 'money-tracker-settings';
const DEFAULT_GOAL = 2500;
const DEFAULT_WEEKLY = 250;

const el = {
  income: document.getElementById('total-income'),
  expenses: document.getElementById('total-expenses'),
  balance: document.getElementById('current-balance'),
  goalBar: document.getElementById('goal-progress-bar'),
  goalText: document.getElementById('goal-progress-text'),
  goalRemaining: document.getElementById('goal-remaining'),
  weeklyNet: document.getElementById('weekly-net'),
  weeklyTarget: document.getElementById('weekly-target-display'),
  weeklyProgress: document.getElementById('weekly-progress'),
  monthlyList: document.getElementById('monthly-list'),
  transactionsBody: document.getElementById('transactions-body'),
  transactionForm: document.getElementById('transaction-form'),
  transactionId: document.getElementById('transaction-id'),
  transactionAmount: document.getElementById('transaction-amount'),
  transactionType: document.getElementById('transaction-type'),
  transactionCategory: document.getElementById('transaction-category'),
  transactionDate: document.getElementById('transaction-date'),
  transactionDescription: document.getElementById('transaction-description'),
  transactionSubmit: document.getElementById('transaction-submit'),
  transactionCancel: document.getElementById('transaction-cancel'),
  goalForm: document.getElementById('goal-form'),
  goalAmount: document.getElementById('goal-amount'),
  weeklyTargetInput: document.getElementById('weekly-target'),
};

let transactions = [];
let settings = { goalAmount: DEFAULT_GOAL, weeklyTarget: DEFAULT_WEEKLY };

function loadData() {
  const rawTransactions = localStorage.getItem(STORAGE_KEY);
  transactions = rawTransactions ? JSON.parse(rawTransactions) : [];
  const rawSettings = localStorage.getItem(GOAL_KEY);
  if (rawSettings) {
    settings = JSON.parse(rawSettings);
  }
  settings.goalAmount = settings.goalAmount || DEFAULT_GOAL;
  settings.weeklyTarget = settings.weeklyTarget || DEFAULT_WEEKLY;
}

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
  localStorage.setItem(GOAL_KEY, JSON.stringify(settings));
}

function formatCurrency(value) {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    maximumFractionDigits: 2,
  }).format(value);
}

function getWeekStart(date) {
  const clone = new Date(date);
  const day = clone.getDay();
  const diff = (day + 6) % 7;
  clone.setDate(clone.getDate() - diff);
  clone.setHours(0, 0, 0, 0);
  return clone;
}

function buildSummary() {
  const totalIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
  const balance = totalIncome - totalExpenses;
  const progress = Math.min(100, Math.max(0, (balance / settings.goalAmount) * 100));
  const remainingAmount = Math.max(0, settings.goalAmount - balance);
  return { totalIncome, totalExpenses, balance, progress, remainingAmount };
}

function getMonthlyRecords() {
  const grouped = {};
  const categories = {};
  transactions.forEach((transaction) => {
    const date = new Date(transaction.date);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    grouped[key] = grouped[key] || { income: 0, expense: 0, label: `${date.toLocaleString('en-GB', { month: 'short' })} ${date.getFullYear()}` };
    grouped[key][transaction.type] += transaction.amount;
    const categoryKey = transaction.category || 'other';
    categories[categoryKey] = categories[categoryKey] || 0;
    categories[categoryKey] += transaction.type === 'expense' ? transaction.amount : 0;
  });

  const months = Object.entries(grouped)
    .sort((a, b) => b[0].localeCompare(a[0]))
    .slice(0, 6)
    .map(([key, value]) => ({ key, ...value, net: value.income - value.expense }));
  const categoryList = Object.entries(categories)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);
  return { months, categoryList };
}

function getWeeklyStats() {
  const today = new Date();
  const weekStart = getWeekStart(today);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 7);

  const weeklyIncome = transactions
    .filter((t) => {
      const txDate = new Date(t.date);
      return txDate >= weekStart && txDate < weekEnd && t.type === 'income';
    })
    .reduce((sum, t) => sum + t.amount, 0);

  const weeklyExpense = transactions
    .filter((t) => {
      const txDate = new Date(t.date);
      return txDate >= weekStart && txDate < weekEnd && t.type === 'expense';
    })
    .reduce((sum, t) => sum + t.amount, 0);

  const net = weeklyIncome - weeklyExpense;
  const progress = Math.min(100, Math.max(0, (net / settings.weeklyTarget) * 100));
  return { weeklyIncome, weeklyExpense, net, progress };
}

function getEstimatedCompletion(balance) {
  const dateNinetyDaysAgo = new Date();
  dateNinetyDaysAgo.setDate(dateNinetyDaysAgo.getDate() - 90);
  const savingsHistory = transactions.filter((t) => new Date(t.date) >= dateNinetyDaysAgo);
  const historyNet = savingsHistory.reduce((sum, t) => sum + (t.type === 'income' ? t.amount : -t.amount), 0);
  const dailyRate = historyNet / 90;
  if (dailyRate <= 0.01) {
    return 'N/A';
  }
  const remaining = Math.max(0, settings.goalAmount - balance);
  const days = Math.ceil(remaining / dailyRate);
  const finishDate = new Date();
  finishDate.setDate(finishDate.getDate() + days);
  return `${finishDate.toLocaleDateString('en-GB')} (${days} days)`;
}

function renderDashboard() {
  const summary = buildSummary();
  el.income.textContent = formatCurrency(summary.totalIncome);
  el.expenses.textContent = formatCurrency(summary.totalExpenses);
  el.balance.textContent = formatCurrency(summary.balance);
  el.goalText.textContent = `${Math.round(summary.progress)}%`;
  el.goalRemaining.textContent = `Remaining ${formatCurrency(summary.remainingAmount)}`;
  el.goalBar.style.width = `${summary.progress}%`;
}

function renderMonthlyBreakdown() {
  const { months, categoryList } = getMonthlyRecords();
  const maxNet = Math.max(...months.map((month) => month.net), 100);
  const monthNodes = months.map((month) => {
    const width = Math.abs(month.net) / maxNet * 100;
    return `
      <div class="month-item">
        <div class="month-header">
          <strong>${month.label}</strong>
          <span>${formatCurrency(month.net)}</span>
        </div>
        <div class="month-bar">
          <div class="month-fill" style="width: ${width}%"></div>
        </div>
      </div>`;
  });

  const categoryNodes = categoryList.length
    ? `<div style="margin-top: 16px;"><strong>Top expense categories</strong>${categoryList
        .map((entry) => `<div class="month-header"><span>${entry[0]}</span><span>${formatCurrency(entry[1])}</span></div>`)
        .join('')}</div>`
    : '<p>No category spending yet.</p>';

  el.monthlyList.innerHTML = monthNodes.join('') + categoryNodes;
}

function renderWeeklyTracker() {
  const weekly = getWeeklyStats();
  el.weeklyNet.textContent = formatCurrency(weekly.net);
  el.weeklyTarget.textContent = formatCurrency(settings.weeklyTarget);
  el.weeklyProgress.textContent = `${Math.round(weekly.progress)}%`;
}

function renderTransactions() {
  const rows = transactions
    .slice()
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .map((transaction) => {
      return `
        <tr>
          <td>${new Date(transaction.date).toLocaleDateString('en-GB')}</td>
          <td>${transaction.description || '-'}</td>
          <td>${transaction.category}</td>
          <td>${transaction.type}</td>
          <td>${formatCurrency(transaction.amount)}</td>
          <td>
            <button type="button" data-action="edit" data-id="${transaction.id}">Edit</button>
            <button type="button" data-action="delete" data-id="${transaction.id}">Delete</button>
          </td>
        </tr>`;
    })
    .join('');
  el.transactionsBody.innerHTML = rows || '<tr><td colspan="6">No transactions yet.</td></tr>';
}

function renderForms() {
  el.goalAmount.value = settings.goalAmount;
  el.weeklyTargetInput.value = settings.weeklyTarget;
  if (!el.transactionDate.value) {
    el.transactionDate.value = new Date().toISOString().slice(0, 10);
  }
}

function renderAll() {
  renderDashboard();
  renderMonthlyBreakdown();
  renderWeeklyTracker();
  renderTransactions();
  renderForms();
}

function resetTransactionForm() {
  el.transactionId.value = '';
  el.transactionAmount.value = '';
  el.transactionType.value = 'income';
  el.transactionCategory.value = 'salary';
  el.transactionDescription.value = '';
  el.transactionDate.value = new Date().toISOString().slice(0, 10);
  el.transactionSubmit.textContent = 'Save Transaction';
  el.transactionCancel.classList.add('hidden');
}

function handleTransactionSubmit(event) {
  event.preventDefault();
  const amountValue = Number(el.transactionAmount.value);
  if (!amountValue || amountValue <= 0) {
    alert('Enter a valid amount.');
    return;
  }
  const newTransaction = {
    id: el.transactionId.value || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    amount: amountValue,
    type: el.transactionType.value,
    category: el.transactionCategory.value,
    date: el.transactionDate.value,
    description: el.transactionDescription.value.trim(),
  };

  const existingIndex = transactions.findIndex((tx) => tx.id === newTransaction.id);
  if (existingIndex >= 0) {
    transactions[existingIndex] = newTransaction;
  } else {
    transactions.push(newTransaction);
  }
  saveData();
  renderAll();
  resetTransactionForm();
}

function handleTransactionAction(event) {
  const button = event.target.closest('button');
  if (!button) return;
  const id = button.dataset.id;
  const action = button.dataset.action;
  if (!id || !action) return;

  if (action === 'delete') {
    const confirmed = confirm('Remove this transaction?');
    if (!confirmed) return;
    transactions = transactions.filter((tx) => tx.id !== id);
    saveData();
    renderAll();
    return;
  }

  if (action === 'edit') {
    const transaction = transactions.find((tx) => tx.id === id);
    if (!transaction) return;
    el.transactionId.value = transaction.id;
    el.transactionAmount.value = transaction.amount;
    el.transactionType.value = transaction.type;
    el.transactionCategory.value = transaction.category;
    el.transactionDate.value = transaction.date;
    el.transactionDescription.value = transaction.description;
    el.transactionSubmit.textContent = 'Update Transaction';
    el.transactionCancel.classList.remove('hidden');
  }
}

function handleCancelEdit() {
  resetTransactionForm();
}

function handleGoalSubmit(event) {
  event.preventDefault();
  const goalValue = Number(el.goalAmount.value);
  const weeklyValue = Number(el.weeklyTargetInput.value);
  if (!goalValue || goalValue <= 0 || !weeklyValue || weeklyValue <= 0) {
    alert('Enter valid goal and weekly target values.');
    return;
  }
  settings.goalAmount = goalValue;
  settings.weeklyTarget = weeklyValue;
  saveData();
  renderAll();
}

function init() {
  loadData();
  renderAll();
  el.transactionForm.addEventListener('submit', handleTransactionSubmit);
  el.goalForm.addEventListener('submit', handleGoalSubmit);
  el.transactionsBody.addEventListener('click', handleTransactionAction);
  el.transactionCancel.addEventListener('click', handleCancelEdit);
}

init();
