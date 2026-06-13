import { useMemo, useState } from 'react';
import { useApplicationContext } from '../lib/applicationContext';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';

function ExportPage() {
  const { applications, loadSeed } = useApplicationContext();
  const [backupData, setBackupData] = useState('');

  const csvData = useMemo(() => {
    const header = [
      'Company',
      'Job Title',
      'Job Type',
      'Location',
      'Salary',
      'Applied Date',
      'Deadline Date',
      'Sponsorship',
      'Source',
      'Application Link',
      'Contact Person',
      'Status',
      'Notes',
      'Last Updated',
    ];
    const rows = applications.map((application) => [
      application.company,
      application.title,
      application.type,
      application.location,
      application.salary,
      application.appliedDate,
      application.deadlineDate,
      application.sponsorship,
      application.source,
      application.applicationLink,
      application.contactPerson,
      application.status,
      application.notes.join(' | '),
      application.lastUpdated,
    ]);
    const escapeValue = (value: string) => `"${value.replace(/"/g, '""')}"`;
    return [header, ...rows].map((row) => row.map((cell) => escapeValue(cell)).join(',')).join('\n');
  }, [applications]);

  const exportCsv = () => {
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, 'job-applications.csv');
  };

  const exportExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      applications.map((application) => ({
        Company: application.company,
        'Job Title': application.title,
        'Job Type': application.type,
        Location: application.location,
        Salary: application.salary,
        'Applied Date': application.appliedDate,
        'Deadline Date': application.deadlineDate,
        Sponsorship: application.sponsorship,
        Source: application.source,
        'Application Link': application.applicationLink,
        'Contact Person': application.contactPerson,
        Status: application.status,
        Notes: application.notes.join(' | '),
        'Last Updated': application.lastUpdated,
      }))
    );
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Applications');
    const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    saveAs(new Blob([wbout], { type: 'application/octet-stream' }), 'job-applications.xlsx');
  };

  const backup = () => {
    const payload = JSON.stringify(applications, null, 2);
    setBackupData(payload);
  };

  const restore = () => {
    try {
      const parsed = JSON.parse(backupData);
      if (Array.isArray(parsed)) {
        localStorage.setItem('job-application-tracker-data', JSON.stringify(parsed));
        window.location.reload();
      }
    } catch {
      alert('Invalid backup JSON');
    }
  };

  return (
    <section className="page-shell">
      <div className="page-header">
        <div>
          <p className="eyebrow">Export & backup</p>
          <h2>Save, restore, and download your data</h2>
        </div>
        <p className="page-intro">Export to CSV or Excel, backup local storage, and restore from a JSON backup.</p>
      </div>

      <div className="export-grid">
        <article className="card export-card">
          <h3>Download</h3>
          <p>Export all tracked applications to a file for offline review.</p>
          <div className="button-row">
            <button onClick={exportCsv}>Export CSV</button>
            <button className="secondary" onClick={exportExcel}>
              Export Excel
            </button>
          </div>
        </article>

        <article className="card export-card">
          <h3>Backup / restore</h3>
          <p>Use the JSON backup to move data between browsers or save a snapshot.</p>
          <div className="button-row">
            <button onClick={backup}>Create backup</button>
            <button className="secondary" onClick={loadSeed}>
              Load example data
            </button>
          </div>
          <textarea
            value={backupData}
            onChange={(event) => setBackupData(event.target.value)}
            rows={12}
            placeholder="Paste backup JSON here to restore"
          />
          <button onClick={restore}>Restore data</button>
        </article>
      </div>
    </section>
  );
}

export default ExportPage;
