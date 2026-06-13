import { useEffect, useMemo, useState } from 'react';

type TransactionType = 'income' | 'expense';

type Transaction = {
  id: string;
  amount: number;
  type: TransactionType;
  category: string;
  date: string;
  description: string;
};

type Settings = {
  goalAmount: number;
  weeklyTarget: number;
};

const STORAGE_KEY = 'money-tracker-transactions';
const SETTINGS_KEY = 'money-tracker-settings';

const defaultSettings: Settings = {
  goalAmount: 2500,
  weeklyTarget: 250,
};

const categoryOptions = ['Salary', 'Freelance', 'Training', 'Certifications', 'Travel', 'Equipment', 'Other'];

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 2 }).format(value);
}

function getWeekStart(date: Date) {
  const start = new Date(date);
  const day = start.getDay();
  const diff = (day + 6) % 7;
  start.setDate(start.getDate() - diff);
  start.setHours(0, 0, 0, 0);
  return start;
}

function MoneyTrackerPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [form, setForm] = useState({
    id: '',
    amount: '',
    type: 'income' as TransactionType,
    category: 'Salary',
    date: new Date().toISOString().slice(0, 10),
    description: '',
  });

  useEffect(() => {
    const storedTransactions = localStorage.getItem(STORAGE_KEY);
    const storedSettings = localStorage.getItem(SETTINGS_KEY);

    if (storedTransactions) {
      try {
        setTransactions(JSON.parse(storedTransactions));
      } catch {
        setTransactions([]);
      }
    }

    if (storedSettings) {
      try {
        setSettings(JSON.parse(storedSettings));
      } catch {
        setSettings(defaultSettings);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }, [settings]);

  const summary = useMemo(() => {
    const income = transactions.filter((t) => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const expenses = transactions.filter((t) => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    const balance = income - expenses;
    const progress = settings.goalAmount ? Math.min(100, Math.max(0, (balance / settings.goalAmount) * 100)) : 0;
    return { income, expenses, balance, progress, remaining: Math.max(0, settings.goalAmount - balance) };
  }, [transactions, settings.goalAmount]);

  const weeklySummary = useMemo(() => {
    const today = new Date();
    const weekStart = getWeekStart(today);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);

    const weeklyIncome = transactions
      .filter((transaction) => new Date(transaction.date) >= weekStart && new Date(transaction.date) < weekEnd && transaction.type === 'income')
      .reduce((sum, transaction) => sum + transaction.amount, 0);

    const weeklyExpenses = transactions
      .filter((transaction) => new Date(transaction.date) >= weekStart && new Date(transaction.date) < weekEnd && transaction.type === 'expense')
      .reduce((sum, transaction) => sum + transaction.amount, 0);

    const net = weeklyIncome - weeklyExpenses;
    const weeklyProgress = settings.weeklyTarget ? Math.min(100, Math.max(0, (net / settings.weeklyTarget) * 100)) : 0;
    return { weeklyIncome, weeklyExpenses, net, weeklyProgress };
  }, [transactions, settings.weeklyTarget]);

  const monthlyRecords = useMemo(() => {
    const map = new Map<string, { label: string; income: number; expense: number }>();

    transactions.forEach((transaction) => {
      const date = new Date(transaction.date);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const label = date.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
      const entry = map.get(key) || { label, income: 0, expense: 0 };
      if (transaction.type === 'income') entry.income += transaction.amount;
      else entry.expense += transaction.amount;
      map.set(key, entry);
    });

    return Array.from(map.entries())
      .sort((a, b) => b[0].localeCompare(a[0]))
      .slice(0, 6)
      .map(([key, record]) => ({ key, ...record, net: record.income - record.expense }));
  }, [transactions]);

  const categoryTotals = useMemo(() => {
    const totals = new Map<string, number>();
    transactions.forEach((transaction) => {
      if (transaction.type === 'expense') {
        totals.set(transaction.category, (totals.get(transaction.category) || 0) + transaction.amount);
      }
    });

    return Array.from(totals.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [transactions]);

  const editTransaction = (id: string) => {
    const transaction = transactions.find((item) => item.id === id);
    if (!transaction) return;
    setForm({
      id: transaction.id,
      amount: transaction.amount.toString(),
      type: transaction.type,
      category: transaction.category,
      date: transaction.date,
      description: transaction.description,
    });
  };

  const resetForm = () => {
    setForm({
      id: '',
      amount: '',
      type: 'income',
      category: 'Salary',
      date: new Date().toISOString().slice(0, 10),
      description: '',
    });
  };

  const handleTransactionSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const amount = Number(form.amount);
    if (!amount || amount <= 0) {
      alert('Enter a valid amount.');
      return;
    }

    const transaction: Transaction = {
      id: form.id || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      amount,
      type: form.type,
      category: form.category,
      date: form.date,
      description: form.description.trim(),
    };

    setTransactions((current) => {
      const existingIndex = current.findIndex((item) => item.id === transaction.id);
      if (existingIndex >= 0) {
        const updated = [...current];
        updated[existingIndex] = transaction;
        return updated;
      }
      return [transaction, ...current];
    });

    resetForm();
  };

  const handleDelete = (id: string) => {
    if (!window.confirm('Delete this transaction?')) return;
    setTransactions((current) => current.filter((item) => item.id !== id));
  };

  const handleSettingsSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const goalAmount = Number(settings.goalAmount);
    const weeklyTarget = Number(settings.weeklyTarget);
    if (goalAmount <= 0 || weeklyTarget <= 0) {
      alert('Enter valid goal and weekly target amounts.');
      return;
    }
    setSettings({ goalAmount, weeklyTarget });
  };

  return (
    <section className="page-shell">
      <div className="page-header">
        <div>
          <p className="eyebrow">Money tracker</p>
          <h2>Personal finance section</h2>
        </div>
        <p className="page-intro">Track income, expenses, savings goal progress, and weekly performance.</p>
      </div>

      <div className="summary-grid">
        <article className="stat-card">
          <strong>{formatCurrency(summary.income)}</strong>
          <span>Total income</span>
        </article>
        <article className="stat-card">
          <strong>{formatCurrency(summary.expenses)}</strong>
          <span>Total expenses</span>
        </article>
        <article className="stat-card">
          <strong>{formatCurrency(summary.balance)}</strong>
          <span>Current balance</span>
        </article>
        <article className="stat-card wide-card">
          <strong>{Math.round(summary.progress)}%</strong>
          <span>Goal progress</span>
        </article>
      </div>

      <div className="tracker-grid">
        <article className="card">
          <h3>Monthly snapshot</h3>
          {monthlyRecords.length > 0 ? (
            <div className="card-list">
              {monthlyRecords.map((record) => (
                <div key={record.key} className="month-item">
                  <div className="month-header">
                    <strong>{record.label}</strong>
                    <span>{formatCurrency(record.net)}</span>
                  </div>
                  <div className="month-bar">
                    <div className="month-fill" style={{ width: `${Math.min(100, Math.abs(record.net) / Math.max(1, Math.abs(monthlyRecords[0].net)) * 100)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="empty-state">No monthly records yet.</p>
          )}
          <div style={{ marginTop: '18px' }}>
            <strong>Top expense categories</strong>
            {categoryTotals.length > 0 ? (
              categoryTotals.map(([category, amount]) => (
                <div key={category} className="month-header">
                  <span>{category}</span>
                  <span>{formatCurrency(amount)}</span>
                </div>
              ))
            ) : (
              <p className="empty-state">No expense categories tracked yet.</p>
            )}
          </div>
        </article>

        <article className="card">
          <h3>Weekly performance</h3>
          <div className="card-list">
            <div className="month-header">
              <span>Income this week</span>
              <strong>{formatCurrency(weeklySummary.weeklyIncome)}</strong>
            </div>
            <div className="month-header">
              <span>Expenses this week</span>
              <strong>{formatCurrency(weeklySummary.weeklyExpenses)}</strong>
            </div>
            <div className="month-header">
              <span>Net balance</span>
              <strong>{formatCurrency(weeklySummary.net)}</strong>
            </div>
          </div>
          <div className="month-header" style={{ marginTop: '16px' }}>
            <span>Weekly target</span>
            <strong>{formatCurrency(settings.weeklyTarget)}</strong>
          </div>
          <div className="month-bar" style={{ marginTop: '12px' }}>
            <div className="month-fill" style={{ width: `${Math.min(100, weeklySummary.weeklyProgress)}%` }} />
          </div>
          <p style={{ marginTop: '12px', color: 'var(--text-muted)' }}>
            {Math.round(weeklySummary.weeklyProgress)}% of weekly target
          </p>
        </article>
      </div>

      <div className="details-grid">
        <article className="card form-card">
          <h3>{form.id ? 'Edit transaction' : 'Add transaction'}</h3>
          <form onSubmit={handleTransactionSubmit} className="form-grid">
            <label>
              Amount
              <input
                type="number"
                value={form.amount}
                onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))}
                required
                step="0.01"
                min="0"
                placeholder="0.00"
              />
            </label>
            <label>
              Type
              <select value={form.type} onChange={(event) => setForm((current) => ({ ...current, type: event.target.value as TransactionType }))}>
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </select>
            </label>
            <label>
              Category
              <select value={form.category} onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))}>
                {categoryOptions.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Date
              <input type="date" value={form.date} onChange={(event) => setForm((current) => ({ ...current, date: event.target.value }))} required />
            </label>
            <label className="full-width">
              Description
              <input
                value={form.description}
                onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                placeholder="Optional memo"
              />
            </label>
            <div className="form-actions full-width">
              <button type="submit">Save transaction</button>
              <button type="button" className="secondary" onClick={resetForm}>
                Reset
              </button>
            </div>
          </form>
        </article>

        <article className="card">
          <h3>Settings</h3>
          <form onSubmit={handleSettingsSubmit} className="form-grid">
            <label>
              Savings goal
              <input
                type="number"
                value={settings.goalAmount}
                onChange={(event) => setSettings((current) => ({ ...current, goalAmount: Number(event.target.value) }))}
                min="1"
                required
              />
            </label>
            <label>
              Weekly target
              <input
                type="number"
                value={settings.weeklyTarget}
                onChange={(event) => setSettings((current) => ({ ...current, weeklyTarget: Number(event.target.value) }))}
                min="1"
                required
              />
            </label>
            <div className="form-actions full-width">
              <button type="submit">Update settings</button>
            </div>
          </form>
        </article>
      </div>

      <article className="card">
        <h3>Transactions</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Description</th>
                <th>Category</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {transactions.length > 0 ? (
                transactions.map((transaction) => (
                  <tr key={transaction.id}>
                    <td>{new Date(transaction.date).toLocaleDateString('en-GB')}</td>
                    <td>{transaction.description || '-'}</td>
                    <td>{transaction.category}</td>
                    <td>{transaction.type}</td>
                    <td>{formatCurrency(transaction.amount)}</td>
                    <td className="actions-cell">
                      <button type="button" className="button muted" onClick={() => editTransaction(transaction.id)}>
                        Edit
                      </button>
                      <button type="button" className="button danger" onClick={() => handleDelete(transaction.id)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="empty-state">
                    No transactions recorded.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </article>
    </section>
  );
}

export default MoneyTrackerPage;
