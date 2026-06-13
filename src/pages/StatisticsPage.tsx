import { useMemo } from 'react';
import { useApplicationContext } from '../lib/applicationContext';

function StatisticsPage() {
  const { applications } = useApplicationContext();

  const stats = useMemo(() => {
    const byMonth = new Map<string, number>();
    const bySource = new Map<string, number>();
    const byCompany = new Map<string, number>();
    const sponsorCounts = new Map<string, number>();
    let interviewCount = 0;
    let offerCount = 0;
    let appliedCount = 0;

    applications.forEach((app) => {
      const monthKey = new Date(app.appliedDate).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
      byMonth.set(monthKey, (byMonth.get(monthKey) || 0) + 1);
      bySource.set(app.source, (bySource.get(app.source) || 0) + 1);
      byCompany.set(app.company, (byCompany.get(app.company) || 0) + 1);
      sponsorCounts.set(app.sponsorship, (sponsorCounts.get(app.sponsorship) || 0) + 1);
      if (app.status.includes('Interview')) interviewCount += 1;
      if (app.status === 'Offer') offerCount += 1;
      if (app.status !== 'Draft') appliedCount += 1;
    });

    const monthList = Array.from(byMonth.entries()).sort((a, b) => b[0].localeCompare(a[0]));
    const sourceList = Array.from(bySource.entries()).sort((a, b) => b[1] - a[1]);
    const companyList = Array.from(byCompany.entries()).sort((a, b) => b[1] - a[1]);
    const sponsorList = Array.from(sponsorCounts.entries());
    const interviewConversion = appliedCount ? Math.round((interviewCount / appliedCount) * 100) : 0;
    const offerConversion = appliedCount ? Math.round((offerCount / appliedCount) * 100) : 0;

    return { monthList, sourceList, companyList, sponsorList, interviewConversion, offerConversion };
  }, [applications]);

  return (
    <section className="page-shell">
      <div className="page-header">
        <div>
          <p className="eyebrow">Statistics</p>
          <h2>Performance and hiring insights</h2>
        </div>
        <p className="page-intro">Understand where your applications come from and which sources convert best.</p>
      </div>

      <div className="stats-grid">
        <article className="stat-card">
          <h3>Applications by month</h3>
          <ul>
            {stats.monthList.map(([month, count]) => (
              <li key={month}>
                <strong>{month}</strong> <span>{count}</span>
              </li>
            ))}
          </ul>
        </article>
        <article className="stat-card">
          <h3>Applications by source</h3>
          <ul>
            {stats.sourceList.map(([source, count]) => (
              <li key={source}>
                <strong>{source}</strong> <span>{count}</span>
              </li>
            ))}
          </ul>
        </article>
        <article className="stat-card">
          <h3>Applications by company</h3>
          <ul>
            {stats.companyList.map(([company, count]) => (
              <li key={company}>
                <strong>{company}</strong> <span>{count}</span>
              </li>
            ))}
          </ul>
        </article>
        <article className="stat-card">
          <h3>Sponsorship opportunities</h3>
          <ul>
            {stats.sponsorList.map(([option, count]) => (
              <li key={option}>
                <strong>{option}</strong> <span>{count}</span>
              </li>
            ))}
          </ul>
        </article>
        <article className="stat-card wide-card">
          <h3>Conversion rates</h3>
          <div className="conversion-row">
            <div>
              <span>Interview conversion</span>
              <strong>{stats.interviewConversion}%</strong>
            </div>
            <div>
              <span>Offer conversion</span>
              <strong>{stats.offerConversion}%</strong>
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}

export default StatisticsPage;
