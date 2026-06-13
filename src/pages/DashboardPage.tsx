import { useMemo } from 'react';
import { useApplicationContext } from '../lib/applicationContext';
import { Pie, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

const statusLabels = [
  'Draft',
  'Applied',
  'Assessment',
  'Video Interview',
  'Technical Interview',
  'Final Interview',
  'Offer',
  'Rejected',
  'Withdrawn',
];

function getWeekLabel(dateString: string) {
  const date = new Date(dateString);
  const start = new Date(date);
  start.setDate(date.getDate() - ((date.getDay() + 6) % 7));
  return `${start.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}`;
}

function DashboardPage() {
  const { applications } = useApplicationContext();

  const stats = useMemo(() => {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - ((now.getDay() + 6) % 7));
    startOfWeek.setHours(0, 0, 0, 0);

    const total = applications.length;
    const thisWeek = applications.filter((app) => new Date(app.appliedDate) >= startOfWeek).length;
    const interviewInvites = applications.filter((app) => app.status.includes('Interview')).length;
    const rejections = applications.filter((app) => app.status === 'Rejected').length;
    const offers = applications.filter((app) => app.status === 'Offer').length;
    const awaitingResponse = applications.filter((app) => app.status === 'Applied' || app.status === 'Assessment').length;
    const successRate = total ? Math.round((offers / total) * 100) : 0;

    const statusCounts = statusLabels.map((status) => applications.filter((app) => app.status === status).length);
    const weeks = Array.from({ length: 6 }).map((_, index) => {
      const current = new Date(startOfWeek);
      current.setDate(startOfWeek.getDate() - index * 7);
      current.setHours(0, 0, 0, 0);
      const weekStart = new Date(current);
      const weekEnd = new Date(current);
      weekEnd.setDate(current.getDate() + 7);
      return {
        label: `${weekStart.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}`,
        count: applications.filter((app) => {
          const date = new Date(app.appliedDate);
          return date >= weekStart && date < weekEnd;
        }).length,
      };
    }).reverse();

    return { total, thisWeek, interviewInvites, rejections, offers, awaitingResponse, successRate, statusCounts, weeks };
  }, [applications]);

  return (
    <section className="page-shell">
      <div className="page-header">
        <div>
          <p className="eyebrow">Dashboard</p>
          <h2>Your applications at a glance</h2>
        </div>
        <p className="page-intro">Track progress, interviews, offers, and follow-up reminders for every application.</p>
      </div>

      <div className="summary-grid">
        <article className="stat-card">
          <strong>{stats.total}</strong>
          <span>Total applications</span>
        </article>
        <article className="stat-card">
          <strong>{stats.thisWeek}</strong>
          <span>Applications this week</span>
        </article>
        <article className="stat-card">
          <strong>{stats.interviewInvites}</strong>
          <span>Interview invitations</span>
        </article>
        <article className="stat-card">
          <strong>{stats.rejections}</strong>
          <span>Rejections</span>
        </article>
        <article className="stat-card">
          <strong>{stats.offers}</strong>
          <span>Offers</span>
        </article>
        <article className="stat-card">
          <strong>{stats.awaitingResponse}</strong>
          <span>Awaiting response</span>
        </article>
        <article className="stat-card wide-card">
          <strong>{stats.successRate}%</strong>
          <span>Success rate</span>
        </article>
      </div>

      <div className="charts-grid">
        <div className="chart-card">
          <h3>Applications per week</h3>
          <Bar
            data={{
              labels: stats.weeks.map((week) => week.label),
              datasets: [
                {
                  label: 'Applications',
                  data: stats.weeks.map((week) => week.count),
                  backgroundColor: '#5b8cff',
                  borderRadius: 10,
                },
              ],
            }}
            options={{
              responsive: true,
              plugins: { legend: { display: false } },
              scales: {
                y: { beginAtZero: true, ticks: { precision: 0 } },
              },
            }}
          />
        </div>

        <div className="chart-card">
          <h3>Applications by status</h3>
          <Pie
            data={{
              labels: statusLabels,
              datasets: [
                {
                  data: stats.statusCounts,
                  backgroundColor: [
                    '#475569',
                    '#2563eb',
                    '#f59e0b',
                    '#8b5cf6',
                    '#14b8a6',
                    '#22c55e',
                    '#0ea5e9',
                    '#ef4444',
                    '#334155',
                  ],
                },
              ],
            }}
            options={{ responsive: true, plugins: { legend: { position: 'bottom' } } }}
          />
        </div>
      </div>
    </section>
  );
}

export default DashboardPage;
