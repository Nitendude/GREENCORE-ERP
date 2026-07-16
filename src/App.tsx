import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './store/AuthContext';
import { DataProvider } from './store/DataContext';
import AppLayout from './components/layout/AppLayout';
import RequirePermission from './components/layout/RequirePermission';

import Dashboard from './pages/Dashboard/Dashboard';
import ProjectsList from './pages/Projects/ProjectsList';
import ProjectWorkspace from './pages/Projects/ProjectWorkspace/ProjectWorkspace';
import BiddingList from './pages/Bidding/BiddingList';
import BidWorkspace from './pages/Bidding/BidWorkspace/BidWorkspace';
import TasksPage from './pages/Tasks/TasksPage';
import DocumentsPage from './pages/Documents/DocumentsPage';
import FinancialsPage from './pages/Financials/FinancialsPage';
import ProcurementPage from './pages/Procurement/ProcurementPage';
import InventoryPage from './pages/Inventory/InventoryPage';
import ReportsPage from './pages/Reports/ReportsPage';
import UsersPage from './pages/Users/UsersPage';
import SettingsPage from './pages/Settings/SettingsPage';
import NotFound from './pages/NotFound';
import Forbidden from './pages/Forbidden';

function App() {
  return (
    <DataProvider>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<AppLayout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<RequirePermission permission="nav.dashboard"><Dashboard /></RequirePermission>} />

            <Route path="projects" element={<RequirePermission permission="nav.projects"><ProjectsList /></RequirePermission>} />
            <Route path="projects/:projectId" element={<Navigate to="overview" replace />} />
            <Route path="projects/:projectId/:tab" element={<RequirePermission permission="nav.projects"><ProjectWorkspace /></RequirePermission>} />

            <Route path="bidding" element={<RequirePermission permission="nav.bidding"><BiddingList /></RequirePermission>} />
            <Route path="bidding/:bidId" element={<Navigate to="overview" replace />} />
            <Route path="bidding/:bidId/:tab" element={<RequirePermission permission="nav.bidding"><BidWorkspace /></RequirePermission>} />

            <Route path="tasks" element={<RequirePermission permission="nav.tasks"><TasksPage /></RequirePermission>} />
            <Route path="documents" element={<RequirePermission permission="nav.documents"><DocumentsPage /></RequirePermission>} />
            <Route path="financials" element={<RequirePermission permission="nav.financials"><FinancialsPage /></RequirePermission>} />
            <Route path="procurement" element={<RequirePermission permission="nav.procurement"><ProcurementPage /></RequirePermission>} />
            <Route path="inventory" element={<RequirePermission permission="nav.inventory"><InventoryPage /></RequirePermission>} />
            <Route path="reports" element={<RequirePermission permission="nav.reports"><ReportsPage /></RequirePermission>} />
            <Route path="users" element={<RequirePermission permission="nav.users"><UsersPage /></RequirePermission>} />
            <Route path="settings" element={<RequirePermission permission="nav.settings"><SettingsPage /></RequirePermission>} />

            <Route path="forbidden" element={<Forbidden />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </AuthProvider>
    </DataProvider>
  );
}

export default App;
