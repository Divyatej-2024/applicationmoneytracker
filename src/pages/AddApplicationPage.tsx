import { useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Application, ApplicationStatus, JobType, Source, Sponsorship, useApplicationContext } from '../lib/applicationContext';

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
const sourceOptions: Source[] = ['LinkedIn', 'Indeed', 'Gradcracker', 'Prospects', 'Company Website', 'Agency', 'Other'];
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

function generateId() {
  return `app-${Math.random().toString(36).slice(2, 10)}`;
}

function AddApplicationPage() {
  const { applications, saveApplication } = useApplicationContext();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const applicationId = searchParams.get('id');

  const existing = useMemo(
    () => applications.find((application) => application.id === applicationId),
    [applicationId, applications]
  );

  const defaultApplication: Application = {
    id: generateId(),
    company: '',
    title: '',
    type: 'Cyber Security',
    location: '',
    salary: '',
    appliedDate: new Date().toISOString().slice(0, 10),
    deadlineDate: new Date().toISOString().slice(0, 10),
    sponsorship: 'Unknown',
    source: 'LinkedIn',
    applicationLink: '',
    contactPerson: '',
    notes: [],
    status: 'Draft',
    lastUpdated: new Date().toISOString(),
  };

  const formData = existing || defaultApplication;

  return (
    <section className="page-shell">
      <div className="page-header">
        <div>
          <p className="eyebrow">Add application</p>
          <h2>{existing ? 'Update application' : 'Create new application'}</h2>
        </div>
        <p className="page-intro">Capture company details, status, sponsorship, source, and next steps.</p>
      </div>

      <form
        className="form-card"
        onSubmit={(event) => {
          event.preventDefault();
          const form = event.currentTarget;
          const data = new FormData(form);
          const notesInput = data.get('notes')?.toString() || '';
          const saved: Application = {
            id: formData.id,
            company: data.get('company')?.toString().trim() || '',
            title: data.get('title')?.toString().trim() || '',
            type: data.get('type') as JobType,
            location: data.get('location')?.toString().trim() || '',
            salary: data.get('salary')?.toString().trim() || '',
            appliedDate: data.get('appliedDate')?.toString() || new Date().toISOString().slice(0, 10),
            deadlineDate: data.get('deadlineDate')?.toString() || new Date().toISOString().slice(0, 10),
            sponsorship: data.get('sponsorship') as Sponsorship,
            source: data.get('source') as Source,
            applicationLink: data.get('applicationLink')?.toString().trim() || '',
            contactPerson: data.get('contactPerson')?.toString().trim() || '',
            notes: notesInput
              .split(/\r?\n/)
              .map((noteLine) => noteLine.trim())
              .filter(Boolean),
            status: data.get('status') as ApplicationStatus,
            lastUpdated: new Date().toISOString(),
          };

          saveApplication(saved);
          navigate('/list');
        }}
      >
        <div className="form-grid">
          <label>
            Company Name
            <input defaultValue={formData.company} name="company" required />
          </label>
          <label>
            Job Title
            <input defaultValue={formData.title} name="title" required />
          </label>
          <label>
            Job Type
            <select defaultValue={formData.type} name="type">
              {jobTypeOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <label>
            Location
            <input defaultValue={formData.location} name="location" />
          </label>
          <label>
            Salary
            <input defaultValue={formData.salary} name="salary" placeholder="£" />
          </label>
          <label>
            Application Date
            <input defaultValue={formData.appliedDate} name="appliedDate" type="date" required />
          </label>
          <label>
            Application Deadline
            <input defaultValue={formData.deadlineDate} name="deadlineDate" type="date" required />
          </label>
          <label>
            Sponsorship Available
            <select defaultValue={formData.sponsorship} name="sponsorship">
              {sponsorshipOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <label>
            Source
            <select defaultValue={formData.source} name="source">
              {sourceOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <label>
            Application Link
            <input defaultValue={formData.applicationLink} name="applicationLink" type="url" />
          </label>
          <label>
            Contact Person
            <input defaultValue={formData.contactPerson} name="contactPerson" />
          </label>
          <label className="full-width">
            Notes
            <textarea defaultValue={formData.notes.join('\n')} name="notes" rows={4} />
          </label>
          <label>
            Status
            <select defaultValue={formData.status} name="status">
              {statusOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="form-actions">
          <button type="submit">Save application</button>
          <button type="button" className="secondary" onClick={() => navigate('/list')}>
            Cancel
          </button>
        </div>
      </form>
    </section>
  );
}

export default AddApplicationPage;
