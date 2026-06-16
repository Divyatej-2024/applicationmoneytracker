const STORAGE_KEY = 'money-tracker-transactions';
const SETTINGS_KEY = 'money-tracker-settings';
const DEFAULT_GOAL = 2500;
const DEFAULT_WEEKLY = 250;
const VAPID_PUBLIC_KEY = '<YOUR_PUBLIC_VAPID_KEY_HERE>'; // Replace with your own VAPID key for real push support.

const el = {
  income: document.getElementById('total-income'),
  expenses: document.getElementById('total-expenses'),
  balance: document.getElementById('current-balance'),
  goalBar: document.getElementById('goal-progress-bar'),
  goalText: document.getElementById('goal-progress-text'),
  goalDeadline: document.getElementById('goal-deadline'),
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
  goalDateInput: document.getElementById('goal-date'),
  contactEmail: document.getElementById('contact-email'),
  contactPhone: document.getElementById('contact-phone'),
  notificationsEnabled: document.getElementById('notifications-enabled'),
  notificationFrequency: document.getElementById('notification-frequency'),
  notificationTime: document.getElementById('notification-time'),
  notificationStatus: document.getElementById('notification-status'),
  requestPermissionBtn: document.getElementById('request-notification-permission'),
  sendReportBtn: document.getElementById('send-report'),
  installAppButton: document.getElementById('install-app-button'),
};

let transactions = [];
let settings = {
  goalAmount: DEFAULT_GOAL,
  weeklyTarget: DEFAULT_WEEKLY,
  goalDate: '2026-09-10',
  email: '',
  phone: '',
  notificationsEnabled: false,
  notificationFrequency: 'daily',
  notificationTime: '09:00',
  notificationPermission: 'default',
  lastAlert: null,
};
let deferredInstallPrompt = null;
let autoAlertTimer = null;

// Global handlers: catch noisy third-party/network errors so they don't appear
// as uncaught exceptions in the console (preserves app behavior).
window.addEventListener('unhandledrejection', (event) => {
  const reason = event.reason;
  const message = reason && reason.message ? reason.message : String(reason);
  if (message && (message.includes('Failed to fetch') || message.includes('NetworkError') || message.includes('CORS'))) {
    console.warn('Network request failed (handled):', message);
    event.preventDefault();
    return;
  }
  console.error('Unhandled promise rejection:', reason);
  event.preventDefault();
});

window.addEventListener('error', (event) => {
  const target = event.target || event.srcElement;
  if (target && target.tagName && (target.tagName === 'LINK' || target.tagName === 'IMG' || target.tagName === 'SCRIPT')) {
    console.warn('Resource failed to load (handled):', target.href || target.src || target.localName);
    event.preventDefault();
  }
});

function loadData() {
  const rawTransactions = localStorage.getItem(STORAGE_KEY);
  transactions = rawTransactions ? JSON.parse(rawTransactions) : [];

  const rawSettings = localStorage.getItem(SETTINGS_KEY);
  if (rawSettings) {
    settings = JSON.parse(rawSettings);
  }

  settings.goalAmount = settings.goalAmount || DEFAULT_GOAL;
  settings.weeklyTarget = settings.weeklyTarget || DEFAULT_WEEKLY;
  settings.goalDate = settings.goalDate || '2026-09-10';
  settings.email = settings.email || '';
  settings.phone = settings.phone || '';
  settings.notificationsEnabled = settings.notificationsEnabled || false;
  settings.notificationFrequency = settings.notificationFrequency || 'daily';
  settings.notificationTime = settings.notificationTime || '09:00';
  settings.notificationPermission = settings.notificationPermission || 'default';
  settings.lastAlert = settings.lastAlert || null;
}

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
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
    grouped[key] = grouped[key] || {
      income: 0,
      expense: 0,
      label: `${date.toLocaleString('en-GB', { month: 'short' })} ${date.getFullYear()}`,
    };
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

function renderDashboard() {
  const summary = buildSummary();
  el.income.textContent = formatCurrency(summary.totalIncome);
  el.expenses.textContent = formatCurrency(summary.totalExpenses);
  el.balance.textContent = formatCurrency(summary.balance);
  el.goalText.textContent = `${Math.round(summary.progress)}%`;
  el.goalRemaining.textContent = `Remaining ${formatCurrency(summary.remainingAmount)}`;
  el.goalBar.style.width = `${summary.progress}%`;
  const deadlineText = settings.goalDate
    ? new Date(settings.goalDate).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : 'No target date set';
  el.goalDeadline.textContent = `Target date: ${deadlineText}`;
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
        .map(
          (entry) => `<div class="month-header"><span>${entry[0]}</span><span>${formatCurrency(entry[1])}</span></div>`,
        )
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
  el.goalDateInput.value = settings.goalDate;
  el.contactEmail.value = settings.email;
  el.contactPhone.value = settings.phone;
  el.notificationsEnabled.checked = settings.notificationsEnabled;
  el.notificationFrequency.value = settings.notificationFrequency;
  el.notificationTime.value = settings.notificationTime;

  const permissionText = Notification.permission === 'granted' ? 'Notifications are enabled.' : 'Notifications permission has not been granted.';
  el.notificationStatus.textContent = `${permissionText} Reminder ${settings.notificationFrequency} at ${settings.notificationTime}.`;

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
  const goalDate = el.goalDateInput.value;
  const email = el.contactEmail.value.trim();
  const phone = el.contactPhone.value.trim();
  const notificationsEnabled = el.notificationsEnabled.checked;
  const notificationFrequency = el.notificationFrequency.value;
  const notificationTime = el.notificationTime.value;

  if (!goalValue || goalValue <= 0 || !weeklyValue || weeklyValue <= 0) {
    alert('Enter valid goal and weekly target values.');
    return;
  }

  settings.goalAmount = goalValue;
  settings.weeklyTarget = weeklyValue;
  settings.goalDate = goalDate || '2026-09-10';
  settings.email = email;
  settings.phone = phone;
  settings.notificationsEnabled = notificationsEnabled;
  settings.notificationFrequency = notificationFrequency;
  settings.notificationTime = notificationTime || '09:00';

  saveData();
  renderAll();
  scheduleAutoAlerts();
  alert('Settings saved. Reminder settings are stored locally.');
}

function buildReport() {
  const weekly = getWeeklyStats();
  return `Daily and regular spending summary:\n\n` +
    `Weekly net: ${formatCurrency(weekly.net)} (${weekly.weeklyExpense ? `Expenses ${formatCurrency(weekly.weeklyExpense)}` : 'No expenses'})\n` +
    `Weekly target: ${formatCurrency(settings.weeklyTarget)}\n` +
    `Progress: ${Math.round(weekly.progress)}%\n\n` +
    `Savings goal: ${formatCurrency(settings.goalAmount)} by ${new Date(settings.goalDate).toLocaleDateString('en-GB')}\n` +
    `Email: ${settings.email || 'Not set'}\n` +
    `Mobile: ${settings.phone || 'Not set'}\n`;
}

function handleSendReport() {
  const report = buildReport();
  if (!settings.email && !settings.phone) {
    alert('Add at least one contact method to send a summary.');
    return;
  }
  if (settings.email) {
    const subject = encodeURIComponent('Money tracker summary');
    const body = encodeURIComponent(report);
    const mailto = `mailto:${settings.email}?subject=${subject}&body=${body}`;
    window.location.href = mailto;
    return;
  }
  alert(`Summary ready for ${settings.phone}. Phone updates aren't sent automatically from this app.`);
}

function getNotificationInterval() {
  if (settings.notificationFrequency === 'weekly') {
    return 7 * 24 * 60 * 60 * 1000;
  }
  return 24 * 60 * 60 * 1000;
}

function shouldSendAlert() {
  if (!settings.notificationsEnabled || settings.notificationFrequency === 'off') return false;
  const now = new Date();
  const [hour, minute] = settings.notificationTime.split(':').map(Number);
  if (isNaN(hour) || isNaN(minute)) return false;
  if (now.getHours() !== hour || now.getMinutes() !== minute) return false;

  if (!settings.lastAlert) return true;

  const last = new Date(settings.lastAlert);
  if (settings.notificationFrequency === 'daily') {
    return now.toDateString() !== last.toDateString();
  }

  if (settings.notificationFrequency === 'weekly') {
    const sameDay = now.getDay() === last.getDay();
    const weekPassed = now - last >= getNotificationInterval();
    return !sameDay && weekPassed;
  }

  return false;
}

function buildNotificationMessage() {
  const weekly = getWeeklyStats();
  const saved = buildSummary().balance;
  return `Savings update:\nSaved so far ${formatCurrency(saved)}.\nThis week net ${formatCurrency(weekly.net)}.\nExpenses ${formatCurrency(weekly.weeklyExpense)}.\nGoal by ${new Date(settings.goalDate).toLocaleDateString('en-GB')}.`;
}

function sendAutoAlert() {
  const message = buildNotificationMessage();
  settings.lastAlert = new Date().toISOString();
  saveData();

  if ('serviceWorker' in navigator && 'Notification' in window) {
    navigator.serviceWorker.ready.then((registration) => {
      registration.showNotification('Savings reminder', {
        body: message,
        icon: 'icon.svg',
      });
    });
    return;
  }

  if (Notification.permission === 'granted') {
    new Notification('Savings reminder', { body: message, icon: 'icon.svg' });
  } else {
    alert(message);
  }
}

function updateAutoAlerts() {
  if (shouldSendAlert()) {
    sendAutoAlert();
  }
}

function scheduleAutoAlerts() {
  if (autoAlertTimer) {
    clearInterval(autoAlertTimer);
  }
  autoAlertTimer = setInterval(updateAutoAlerts, 60 * 1000);
  updateAutoAlerts();
}

function updateNotificationStatus() {
  const permission = Notification.permission;
  settings.notificationPermission = permission;
  saveData();
  renderForms();
}

function requestNotificationPermission() {
  if (!('Notification' in window)) {
    alert('This browser does not support notifications.');
    return;
  }

  Notification.requestPermission().then((permission) => {
    if (permission === 'granted') {
      alert('Notification permission granted. You will receive reminders when the app is open or in the background.');
    } else {
      alert('Notification permission denied. You can still save reminder settings, but notifications will not appear.');
    }
    updateNotificationStatus();
  });
}

function showInstallButton() {
  el.installAppButton.classList.remove('hidden');
}

function hideInstallButton() {
  el.installAppButton.classList.add('hidden');
}

function handleInstallClick() {
  if (!deferredInstallPrompt) return;
  deferredInstallPrompt.prompt();
  deferredInstallPrompt.userChoice.then((choiceResult) => {
    if (choiceResult.outcome === 'accepted') {
      console.log('User accepted install prompt');
    } else {
      console.log('User dismissed install prompt');
    }
    deferredInstallPrompt = null;
    hideInstallButton();
  });
}

async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  try {
    const registration = await navigator.serviceWorker.register('./service-worker.js');
    console.log('Service Worker registered:', registration.scope);

    if ('periodicSync' in registration) {
      try {
        await registration.periodicSync.register('reminder-sync', {
          minInterval: settings.notificationFrequency === 'weekly' ? 7 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000,
        });
      } catch (error) {
        console.log('Periodic sync registration failed:', error);
      }
    }

    return registration;
  } catch (error) {
    console.error('Service Worker registration failed:', error);
  }
}

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

async function subscribeToPushNotifications(registration) {
  if (!registration.pushManager) {
    console.warn('Push manager not available');
    return;
  }

  try {
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });
    console.log('Push subscription successful:', subscription);
    alert('Push notification subscription created. Server endpoint needs a backend to deliver messages.');
  } catch (error) {
    console.error('Push subscription failed:', error);
  }
}

function init() {
  loadData();
  renderAll();
  scheduleAutoAlerts();

  el.transactionForm.addEventListener('submit', handleTransactionSubmit);
  el.goalForm.addEventListener('submit', handleGoalSubmit);
  el.requestPermissionBtn.addEventListener('click', requestNotificationPermission);
  el.sendReportBtn.addEventListener('click', handleSendReport);
  el.installAppButton.addEventListener('click', handleInstallClick);
  el.transactionsBody.addEventListener('click', handleTransactionAction);
  el.transactionCancel.addEventListener('click', handleCancelEdit);

  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferredInstallPrompt = event;
    showInstallButton();
  });

  window.addEventListener('appinstalled', () => {
    console.log('App installed.');
    hideInstallButton();
  });

  if ('serviceWorker' in navigator) {
    registerServiceWorker().then((registration) => {
      if (registration && VAPID_PUBLIC_KEY && VAPID_PUBLIC_KEY !== '<YOUR_PUBLIC_VAPID_KEY_HERE>') {
        subscribeToPushNotifications(registration);
      }
    });
  }
}

init();
