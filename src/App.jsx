import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { Login } from './pages/Login';
import { AnalyticsDashboard } from './pages/AnalyticsDashboard';
import { Dashboard } from './pages/Dashboard';
import { StaffView } from './pages/StaffView';
import { CompanyView } from './pages/CompanyView';
import { ContainerPlanner } from './pages/ContainerPlanner';
import { ContainerDistribution } from './pages/ContainerDistribution';
import { ProductDatabase } from './pages/Database';
import { Approvals } from './pages/Approvals';
import { AuditHistory } from './pages/AuditHistory';
import { Export } from './pages/Export';
import { Profile } from './pages/Profile';
import { StaffManagement } from './pages/StaffManagement';

// New Staff Pages
import { StaffDashboard } from './pages/StaffDashboard';
import { StaffOrders } from './pages/StaffOrders';
import { PendingItems } from './pages/PendingItems';
import { ReceivedItems } from './pages/ReceivedItems';
import { NewProductRequest } from './pages/NewProductRequest';
import { Notifications } from './pages/Notifications';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        {/* Protected Routes for All Authenticated Users */}
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route index element={<AnalyticsDashboard />} />
            <Route path="orders" element={<Dashboard />} />
            <Route path="staff" element={<StaffView />} />
            <Route path="database" element={<ProductDatabase />} />
            <Route path="profile" element={<Profile />} />
            
            {/* New Staff Routes */}
            <Route path="staff/dashboard" element={<StaffDashboard />} />
            <Route path="staff/orders" element={<StaffOrders />} />
            <Route path="staff/pending" element={<PendingItems />} />
            <Route path="staff/received" element={<ReceivedItems />} />
            <Route path="staff/request-product" element={<NewProductRequest />} />
            <Route path="notifications" element={<Notifications />} />
            
            {/* Admin Only Routes */}
            <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
              <Route path="companies" element={<CompanyView />} />
              <Route path="planner" element={<ContainerPlanner />} />
              <Route path="distribution" element={<ContainerDistribution />} />
              <Route path="approvals" element={<Approvals />} />
              <Route path="audit-history" element={<AuditHistory />} />
              <Route path="export" element={<Export />} />
              <Route path="manage-staff" element={<StaffManagement />} />
            </Route>
          </Route>
        </Route>
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
