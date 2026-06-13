import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { applicationSeed } from '../data/sampleApplications';

export type JobType =
  | 'Graduate Scheme'
  | 'Cyber Security'
  | 'IT Support'
  | 'SOC Analyst'
  | 'Warehouse'
  | 'Part-Time'
  | 'Agency'
  | 'Other';

export type Sponsorship = 'Yes' | 'No' | 'Unknown';
export type Source = 'LinkedIn' | 'Indeed' | 'Gradcracker' | 'Prospects' | 'Company Website' | 'Agency' | 'Other';
export type ApplicationStatus =
  | 'Draft'
  | 'Applied'
  | 'Assessment'
  | 'Video Interview'
  | 'Technical Interview'
  | 'Final Interview'
  | 'Offer'
  | 'Rejected'
  | 'Withdrawn';

export interface Application {
  id: string;
  company: string;
  title: string;
  type: JobType;
  location: string;
  salary: string;
  appliedDate: string;
  deadlineDate: string;
  sponsorship: Sponsorship;
  source: Source;
  applicationLink: string;
  contactPerson: string;
  notes: string[];
  status: ApplicationStatus;
  lastUpdated: string;
}

interface ApplicationContextValue {
  applications: Application[];
  loadSeed: () => void;
  saveApplication: (application: Application) => void;
  deleteApplication: (id: string) => void;
  addNote: (id: string, note: string) => void;
}

const STORAGE_KEY = 'job-application-tracker-data';

const ApplicationContext = createContext<ApplicationContextValue | undefined>(undefined);

function getInitialApplications() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored) as Application[];
    } catch {
      return applicationSeed;
    }
  }
  return applicationSeed;
}

function persistApplications(applications: Application[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(applications));
}

export function ApplicationProvider({ children }: { children: React.ReactNode }) {
  const [applications, setApplications] = useState<Application[]>([]);

  useEffect(() => {
    setApplications(getInitialApplications());
  }, []);

  useEffect(() => {
    persistApplications(applications);
  }, [applications]);

  const loadSeed = () => setApplications(applicationSeed);

  const saveApplication = (application: Application) => {
    setApplications((current) => {
      const existing = current.find((item) => item.id === application.id);
      if (existing) {
        return current.map((item) => (item.id === application.id ? application : item));
      }
      return [application, ...current];
    });
  };

  const deleteApplication = (id: string) => {
    setApplications((current) => current.filter((item) => item.id !== id));
  };

  const addNote = (id: string, note: string) => {
    setApplications((current) =>
      current.map((item) =>
        item.id === id
          ? {
              ...item,
              notes: [...item.notes, note],
              lastUpdated: new Date().toISOString(),
            }
          : item
      )
    );
  };

  const value = useMemo(
    () => ({ applications, loadSeed, saveApplication, deleteApplication, addNote }),
    [applications]
  );

  return <ApplicationContext.Provider value={value}>{children}</ApplicationContext.Provider>;
}

export function useApplicationContext() {
  const context = useContext(ApplicationContext);
  if (!context) throw new Error('useApplicationContext must be used within ApplicationProvider');
  return context;
}
