import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './store/AuthContext';
import { DataProvider } from './store/DataContext';
import { DemoConfigProvider } from './store/DemoConfigContext';
import AppLayout from './components/layout/AppLayout';
import RequirePermission from './components/layout/RequirePermission';
import RequireStaff from './components/layout/RequireStaff';
import RequireDemoModule from './components/layout/RequireDemoModule';

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
import LoginPage from './pages/Login/LoginPage';
import DemoWorkshopPage from './pages/Workshop/DemoWorkshopPage';

const CadPage = lazy(() => import('./pages/Cad/CadPage'));
const ClientPortal = lazy(() => import('./pages/ClientPortal/ClientPortal'));
const PortfolioGantt = lazy(() => import('./pages/Gantt/PortfolioGantt'));
const BranchesPage = lazy(() => import('./pages/Branches/BranchesPage'));
const AccessPreviewPage = lazy(() => import('./pages/Access/AccessPreviewPage'));
const CostDatabasePage = lazy(() => import('./pages/CostDatabase/CostDatabasePage'));
const EstimatesList = lazy(() => import('./pages/Estimates/EstimatesList'));
const EstimateWorkspace = lazy(() => import('./pages/Estimates/EstimateWorkspace/EstimateWorkspace'));

function App() {
  return (
    <DataProvider>
      <AuthProvider>
        <DemoConfigProvider>
        <Suspense fallback={<div className="d-flex align-items-center justify-content-center min-vh-100"><div className="spinner-border text-primary" role="status"><span className="visually-hidden">Loading…</span></div></div>}>
        <Routes>
          <Route path="login" element={<LoginPage />} />
          <Route path="client/:inviteToken" element={<ClientPortal />} />

          <Route path="/" element={<RequireStaff><AppLayout /></RequireStaff>}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<RequirePermission permission="nav.dashboard"><Dashboard /></RequirePermission>} />

            <Route path="projects" element={<RequirePermission permission="nav.projects"><RequireDemoModule moduleId="projects"><ProjectsList /></RequireDemoModule></RequirePermission>} />
            <Route path="gantt" element={<RequirePermission permission="nav.gantt"><RequireDemoModule moduleId="gantt"><PortfolioGantt /></RequireDemoModule></RequirePermission>} />
            <Route path="projects/:projectId" element={<Navigate to="overview" replace />} />
            <Route path="projects/:projectId/:tab" element={<RequirePermission permission="nav.projects"><RequireDemoModule moduleId="projects"><ProjectWorkspace /></RequireDemoModule></RequirePermission>} />

            <Route path="bidding" element={<RequirePermission permission="nav.bidding"><RequireDemoModule moduleId="bidding"><BiddingList /></RequireDemoModule></RequirePermission>} />
            <Route path="bidding/:bidId" element={<Navigate to="overview" replace />} />
            <Route path="bidding/:bidId/:tab" element={<RequirePermission permission="nav.bidding"><RequireDemoModule moduleId="bidding"><BidWorkspace /></RequireDemoModule></RequirePermission>} />

            <Route path="cost-database" element={<RequirePermission permission="nav.costdb"><RequireDemoModule moduleId="cost-database"><CostDatabasePage /></RequireDemoModule></RequirePermission>} />
            <Route path="estimates" element={<RequirePermission permission="nav.estimates"><RequireDemoModule moduleId="estimates"><EstimatesList /></RequireDemoModule></RequirePermission>} />
            <Route path="estimates/:estimateId" element={<Navigate to="overview" replace />} />
            <Route path="estimates/:estimateId/:tab" element={<RequirePermission permission="nav.estimates"><RequireDemoModule moduleId="estimates"><EstimateWorkspace /></RequireDemoModule></RequirePermission>} />

            <Route path="tasks" element={<RequirePermission permission="nav.tasks"><RequireDemoModule moduleId="tasks"><TasksPage /></RequireDemoModule></RequirePermission>} />
            <Route path="documents" element={<RequirePermission permission="nav.documents"><RequireDemoModule moduleId="documents"><DocumentsPage /></RequireDemoModule></RequirePermission>} />
            <Route path="cad" element={<RequirePermission permission="nav.cad"><RequireDemoModule moduleId="cad"><CadPage /></RequireDemoModule></RequirePermission>} />
            <Route path="financials" element={<RequirePermission permission="nav.financials"><RequireDemoModule moduleId="financials"><FinancialsPage /></RequireDemoModule></RequirePermission>} />
            <Route path="procurement" element={<RequirePermission permission="nav.procurement"><RequireDemoModule moduleId="procurement"><ProcurementPage /></RequireDemoModule></RequirePermission>} />
            <Route path="inventory" element={<RequirePermission permission="nav.inventory"><RequireDemoModule moduleId="inventory"><InventoryPage /></RequireDemoModule></RequirePermission>} />
            <Route path="reports" element={<RequirePermission permission="nav.reports"><RequireDemoModule moduleId="reports"><ReportsPage /></RequireDemoModule></RequirePermission>} />
            <Route path="branches" element={<RequirePermission permission="nav.branches"><RequireDemoModule moduleId="branches"><BranchesPage /></RequireDemoModule></RequirePermission>} />
            <Route path="access" element={<RequirePermission permission="nav.access"><AccessPreviewPage /></RequirePermission>} />
            <Route path="workshop" element={<RequirePermission permission="nav.workshop"><DemoWorkshopPage /></RequirePermission>} />
            <Route path="users" element={<RequirePermission permission="nav.users"><UsersPage /></RequirePermission>} />
            <Route path="settings" element={<RequirePermission permission="nav.settings"><SettingsPage /></RequirePermission>} />

            <Route path="forbidden" element={<Forbidden />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
        </Suspense>
        </DemoConfigProvider>
      </AuthProvider>
    </DataProvider>
  );
}

export default App;
