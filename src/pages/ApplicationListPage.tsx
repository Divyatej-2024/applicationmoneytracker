import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Application, ApplicationStatus, JobType, Sponsorship, useApplicationContext } from '../lib/applicationContext';

const statusOptions: ApplicationStatus[] = [
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

const jobTypeOptions: JobType[] = [
  'Graduate Scheme',
  'Cyber Security',
  'IT Support',
  'SOC Analyst',
  'Warehouse',
  'Part-Time',
  'Agency',
  'Other',
];

const sponsorshipOptions: Sponsorship[] = ['Yes', 'No', 'Unknown'];

function ApplicationListPage() {
  const { applications, deleteApplication } = useApplicationContext();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [companyFilter, setCompanyFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [sponsorshipFilter, setSponsorshipFilter] = useState('All');
  const [sortKey, setSortKey] = useState('appliedDate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const companies = useMemo(() => Array.from(new Set(applications.map((item) => item.company))).sort(), [applications]);

  const filtered = useMemo(() => {
    return applications
      .filter((app) =>
        app.company.toLowerCase().includes(search.toLowerCase()) ||
        app.title.toLowerCase().includes(search.toLowerCase()) ||
        app.location.toLowerCase().includes(search.toLowerCase())
      )
      .filter((app) => (statusFilter === 'All' ? true : app.status === statusFilter))
      .filter((app) => (companyFilter === 'All' ? true : app.company === companyFilter))
      .filter((app) => (typeFilter === 'All' ? true : app.type === typeFilter))
      .filter((app) => (sponsorshipFilter === 'All' ? true : app.sponsorship === sponsorshipFilter))
      .sort((a, b) => {
        const left = a[sortKey as keyof Application];
        const right = b[sortKey as keyof Application];
        if (sortKey === 'appliedDate' || sortKey === 'deadlineDate') {
          return sortDirection === 'asc'
            ? new Date(left as string).getTime() - new Date(right as string).getTime()
            : new Date(right as string).getTime() - new Date(left as string).getTime();
        }
        const leftValue = left?.toString() || '';
        const rightValue = right?.toString() || '';
        return sortDirection === 'asc' ? leftValue.localeCompare(rightValue) : rightValue.localeCompare(leftValue);
      });
  }, [applications, search, statusFilter, companyFilter, typeFilter, sponsorshipFilter, sortKey, sortDirection]);

  return (
    <section className="page-shell">
      <div className="page-header">
        <div>
          <p className="eyebrow">Applications</p>
          <h2>Manage your tracked roles</h2>
        </div>
        <p className="page-intro">Search, filter, sort, and review every application in one place.</p>
      </div>

      <div className="filters-panel">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by company, title, or location"
        />
        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
          <option>All</option>
          {statusOptions.map((option) => (
            <option key={option}>{option}</option>
          ))}
        </select>
        <select value={companyFilter} onChange={(event) => setCompanyFilter(event.target.value)}>
          <option>All</option>
          {companies.map((company) => (
            <option key={company}>{company}</option>
          ))}
        </select>
        <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}>
          <option>All</option>
          {jobTypeOptions.map((option) => (
            <option key={option}>{option}</option>
          ))}
        </select>
        <select value={sponsorshipFilter} onChange={(event) => setSponsorshipFilter(event.target.value)}>
          <option>All</option>
          {sponsorshipOptions.map((option) => (
            <option key={option}>{option}</option>
          ))}
        </select>
      </div>

      <div className="sort-panel">
        <label>
          Sort by
          <select value={sortKey} onChange={(event) => setSortKey(event.target.value)}>
            <option value="appliedDate">Date applied</option>
            <option value="company">Company</option>
            <option value="title">Job title</option>
            <option value="status">Status</option>
          </select>
        </label>
        <button type="button" onClick={() => setSortDirection((current) => (current === 'asc' ? 'desc' : 'asc'))}>
          {sortDirection === 'asc' ? 'Oldest first' : 'Newest first'}
        </button>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Company</th>
              <th>Job title</th>
              <th>Date applied</th>
              <th>Status</th>
              <th>Location</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((application) => (
              <tr key={application.id}>
                <td>{application.company}</td>
                <td>{application.title}</td>
                <td>{new Date(application.appliedDate).toLocaleDateString('en-GB')}</td>
                <td>{application.status}</td>
                <td>{application.location}</td>
                <td className="actions-cell">
                  <Link to={`/details/${application.id}`} className="button muted">
                    View
                  </Link>
                  <Link to={`/add?id=${application.id}`} className="button secondary">
                    Edit
                  </Link>
                  <button type="button" className="button danger" onClick={() => deleteApplication(application.id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="empty-state">
                  No applications match your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default ApplicationListPage;
