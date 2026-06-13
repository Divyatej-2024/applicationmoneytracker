import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useApplicationContext } from '../lib/applicationContext';

function ApplicationDetailsPage() {
  const { id } = useParams();
  const { applications, addNote } = useApplicationContext();
  const navigate = useNavigate();
  const application = useMemo(
    () => applications.find((item) => item.id === id),
    [applications, id]
  );
  const [note, setNote] = useState('');

  if (!application) {
    return (
      <section className="page-shell">
        <p className="empty-state">Application not found.</p>
        <button onClick={() => navigate('/list')}>Back to list</button>
      </section>
    );
  }

  const timeline = [
    'Applied',
    'Assessment',
    'Video Interview',
    'Technical Interview',
    'Final Interview',
    application.status === 'Offer' ? 'Offer' : 'Rejected',
  ];

  return (
    <section className="page-shell">
      <div className="page-header">
        <div>
          <p className="eyebrow">Application details</p>
          <h2>{application.company} — {application.title}</h2>
        </div>
        <button className="button secondary" onClick={() => navigate('/list')}>
          Back to list
        </button>
      </div>

      <div className="details-grid">
        <article className="card detail-card">
          <h3>Application summary</h3>
          <dl>
            <dt>Company</dt>
            <dd>{application.company}</dd>
            <dt>Job title</dt>
            <dd>{application.title}</dd>
            <dt>Job type</dt>
            <dd>{application.type}</dd>
            <dt>Location</dt>
            <dd>{application.location}</dd>
            <dt>Salary</dt>
            <dd>{application.salary || 'Not entered'}</dd>
            <dt>Status</dt>
            <dd>{application.status}</dd>
            <dt>Applied</dt>
            <dd>{new Date(application.appliedDate).toLocaleDateString('en-GB')}</dd>
            <dt>Deadline</dt>
            <dd>{new Date(application.deadlineDate).toLocaleDateString('en-GB')}</dd>
            <dt>Sponsorship</dt>
            <dd>{application.sponsorship}</dd>
            <dt>Source</dt>
            <dd>{application.source}</dd>
            <dt>Contact</dt>
            <dd>{application.contactPerson || 'Not entered'}</dd>
            <dt>Link</dt>
            <dd>
              {application.applicationLink ? (
                <a href={application.applicationLink} target="_blank" rel="noreferrer">
                  Open application
                </a>
              ) : (
                'Not entered'
              )}
            </dd>
          </dl>
        </article>

        <article className="card detail-card timeline-card">
          <h3>Progress timeline</h3>
          <ol>
            {timeline.map((step, index) => (
              <li key={index} className={application.status === step || (index < timeline.indexOf(application.status) && application.status !== 'Offer' && application.status !== 'Rejected') ? 'completed' : ''}>
                {step}
              </li>
            ))}
          </ol>
        </article>
      </div>

      <article className="card notes-card">
        <div className="notes-header">
          <h3>Notes</h3>
          <span>{application.notes.length} entries</span>
        </div>
        <div className="notes-list">
          {application.notes.length > 0 ? (
            application.notes.map((entry, index) => <p key={index}>{entry}</p>)
          ) : (
            <p className="empty-state">No notes added yet.</p>
          )}
        </div>
        <form
          className="note-form"
          onSubmit={(event) => {
            event.preventDefault();
            if (!note.trim()) return;
            addNote(application.id, note.trim());
            setNote('');
          }}
        >
          <textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="Add a follow-up note" />
          <button type="submit">Add note</button>
        </form>
      </article>
    </section>
  );
}

export default ApplicationDetailsPage;
