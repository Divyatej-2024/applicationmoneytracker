import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Application, useApplicationContext } from '../lib/applicationContext';

function getFollowUpLevel(days: number) {
  if (days >= 21) return { label: 'Overdue', color: 'var(--danger)' };
  if (days >= 14) return { label: 'Urgent', color: 'var(--warning)' };
  if (days >= 7) return { label: 'Due soon', color: '#fbbf24' };
  return { label: 'Normal', color: 'var(--text-muted)' };
}

function FollowUpPage() {
  const { applications } = useApplicationContext();
  const today = new Date();

  const followUps = useMemo(() => {
    return applications
      .filter((application) => !['Offer', 'Rejected', 'Withdrawn'].includes(application.status))
      .map((application) => {
        const referenceDate = new Date(application.lastUpdated || application.appliedDate);
        const daysSince = Math.floor((today.getTime() - referenceDate.getTime()) / (1000 * 60 * 60 * 24));
        return {
          application,
          referenceDate,
          daysSince,
          followUp: getFollowUpLevel(daysSince),
        };
      })
      .filter((item) => item.daysSince >= 7)
      .sort((a, b) => b.daysSince - a.daysSince);
  }, [applications, today]);

  const counts = useMemo(() => {
    return followUps.reduce(
      (acc, item) => {
        if (item.daysSince >= 21) acc.red += 1;
        else if (item.daysSince >= 14) acc.orange += 1;
        else if (item.daysSince >= 7) acc.yellow += 1;
        return acc;
      },
      { yellow: 0, orange: 0, red: 0 }
    );
  }, [followUps]);

  return (
    <section className="page-shell">
      <div className="page-header">
        <div>
          <p className="eyebrow">Follow-up tracker</p>
          <h2>Keep on top of stale applications</h2>
        </div>
        <p className="page-intro">Review applications that need a follow-up, colour-coded by how long you’ve waited.</p>
      </div>

      <div className="summary-grid">
        <article className="stat-card">
          <strong>{followUps.length}</strong>
          <span>Follow-ups due</span>
        </article>
        <article className="stat-card">
          <strong>{counts.yellow}</strong>
          <span>7+ days</span>
        </article>
        <article className="stat-card">
          <strong>{counts.orange}</strong>
          <span>14+ days</span>
        </article>
        <article className="stat-card">
          <strong>{counts.red}</strong>
          <span>21+ days</span>
        </article>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Company</th>
              <th>Job title</th>
              <th>Status</th>
              <th>Days since update</th>
              <th>Next action</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {followUps.map(({ application, daysSince, followUp }) => (
              <tr key={application.id}>
                <td>{application.company}</td>
                <td>{application.title}</td>
                <td>{application.status}</td>
                <td>{daysSince}</td>
                <td>
                  <span style={{ color: followUp.color, fontWeight: 600 }}>{followUp.label}</span>
                </td>
                <td className="actions-cell">
                  <Link to={`/details/${application.id}`} className="button muted">
                    View
                  </Link>
                  <Link to={`/add?id=${application.id}`} className="button secondary">
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
            {followUps.length === 0 && (
              <tr>
                <td colSpan={6} className="empty-state">
                  No follow-ups are due right now.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default FollowUpPage;
