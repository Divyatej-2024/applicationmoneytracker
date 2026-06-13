import { BrowserRouter, Routes, Route } from 'react-router-dom';
import DashboardPage from './pages/DashboardPage';
import AddApplicationPage from './pages/AddApplicationPage';
import ApplicationListPage from './pages/ApplicationListPage';
import ApplicationDetailsPage from './pages/ApplicationDetailsPage';
import StatisticsPage from './pages/StatisticsPage';
import ExportPage from './pages/ExportPage';
import FollowUpPage from './pages/FollowUpPage';
import MoneyTrackerPage from './pages/MoneyTrackerPage';
import { ApplicationProvider } from './lib/applicationContext';

function App() {
  return (
    <ApplicationProvider>
      <BrowserRouter>
        <div className="app-shell">
          <aside className="sidebar">
            <div className="brand-block">
              <div className="brand-logo">CY</div>
              <div>
                <h1>Application Tracker</h1>
                <p>UK Cyber Security Graduate</p>
              </div>
            </div>

            <nav>
              <a href="/">Dashboard</a>
              <a href="/add">Add application</a>
              <a href="/list">Applications</a>
              <a href="/follow-up">Follow-up</a>
              <a href="/stats">Statistics</a>
              <a href="/export">Export</a>
              <a href="/money">Money tracker</a>
            </nav>
          </aside>

          <main className="content-area">
            <Routes>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/add" element={<AddApplicationPage />} />
              <Route path="/list" element={<ApplicationListPage />} />
              <Route path="/follow-up" element={<FollowUpPage />} />
              <Route path="/details/:id" element={<ApplicationDetailsPage />} />
              <Route path="/stats" element={<StatisticsPage />} />
              <Route path="/export" element={<ExportPage />} />
              <Route path="/money" element={<MoneyTrackerPage />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </ApplicationProvider>
  );
}

export default App;
