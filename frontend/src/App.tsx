import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom';

import { AppShell } from './components/AppShell';
import { GuestRoute, ProtectedRoute, RoleProtectedRoute } from './components/ProtectedRoute';
import { ROLES } from './permissions/capabilities';
import { ApprovalsPage } from './pages/ApprovalsPage';
import { AuditLogsPage } from './pages/AuditLogsPage';
import { DashboardPage } from './pages/DashboardPage';
import { ImportCenterPage } from './pages/ImportCenterPage';
import { InventoryPage } from './pages/InventoryPage';
import { InventoryTransactionsPage } from './pages/InventoryTransactionsPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { ProductFormPage } from './pages/ProductFormPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { ProductsPage } from './pages/ProductsPage';
import { PurchaseOrderDetailPage } from './pages/PurchaseOrderDetailPage';
import { PurchaseOrdersPage } from './pages/PurchaseOrdersPage';
import { RegisterPage } from './pages/RegisterPage';
import { VerifyEmailPage } from './pages/VerifyEmailPage';
import { SuppliersPage } from './pages/SuppliersPage';
import { SupplierProfilePage } from './pages/SupplierProfilePage';
import { TenantDrilldownPage } from './pages/TenantDrilldownPage';
import { UnauthorizedPage } from './pages/UnauthorizedPage';
import { UsersPage } from './pages/UsersPage';
import { WarehousesPage } from './pages/WarehousesPage';
import { ProfilePage } from './pages/ProfilePage';
import { ContactPage } from './pages/ContactPage';


// Super Admin Pages
import { TenantsPage } from './pages/TenantsPage';
import { PlatformAnalyticsPage } from './pages/PlatformAnalyticsPage';
import { SystemHealthPage } from './pages/SystemHealthPage';
import { BillingPage } from './pages/BillingPage';
import { PermissionsPage } from './pages/PermissionsPage';
import { SupportCenterPage } from './pages/SupportCenterPage';
import { SettingsPage } from './pages/SettingsPage';
import { NotificationsPage } from './pages/NotificationsPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
      staleTime: 30_000,
    },
  },
});

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route element={<GuestRoute />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/verify-email" element={<VerifyEmailPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          </Route>
          <Route path="/unauthorized" element={<UnauthorizedPage />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<AppShell />}>
              <Route path="/app" element={<DashboardPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route element={<RoleProtectedRoute allowedRoles={[ROLES.RETAILER_ADMIN, ROLES.INVENTORY_MANAGER, ROLES.WAREHOUSE_STAFF, ROLES.AUDITOR, ROLES.PROCUREMENT_MANAGER]} />}>
                <Route path="/products" element={<ProductsPage />} />
                <Route path="/products/:productId" element={<ProductDetailPage />} />
                <Route path="/transactions" element={<InventoryTransactionsPage />} />
                <Route path="/warehouses" element={<WarehousesPage />} />
              </Route>
              <Route element={<RoleProtectedRoute allowedRoles={[ROLES.RETAILER_ADMIN, ROLES.INVENTORY_MANAGER, ROLES.WAREHOUSE_STAFF]} />}>
                <Route path="/inventory" element={<InventoryPage />} />
              </Route>
              <Route element={<RoleProtectedRoute allowedRoles={[ROLES.RETAILER_ADMIN]} />}>
                <Route path="/products/new" element={<ProductFormPage />} />
                <Route path="/products/:productId/edit" element={<ProductFormPage />} />
                <Route path="/imports" element={<ImportCenterPage />} />
              </Route>
              <Route element={<RoleProtectedRoute allowedRoles={[ROLES.RETAILER_ADMIN, ROLES.PROCUREMENT_MANAGER]} />}>
                <Route path="/purchase-orders" element={<PurchaseOrdersPage />} />
                <Route path="/purchase-orders/:purchaseOrderId" element={<PurchaseOrderDetailPage />} />
                <Route path="/suppliers" element={<SuppliersPage />} />
                <Route path="/suppliers/:supplierId" element={<SupplierProfilePage />} />
              </Route>
              <Route element={<RoleProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN]} />}>
                <Route path="/tenants" element={<TenantsPage />} />
                <Route path="/tenants/:tenantId" element={<TenantDrilldownPage />} />
                <Route path="/platform-analytics" element={<Navigate to="/app" replace />} />
                <Route path="/system-health" element={<SystemHealthPage />} />
                <Route path="/billing" element={<BillingPage />} />
                <Route path="/permissions" element={<PermissionsPage />} />
                <Route path="/support-center" element={<SupportCenterPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/notifications" element={<NotificationsPage />} />
              </Route>
              <Route element={<RoleProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.RETAILER_ADMIN]} />}>
                <Route path="/users" element={<UsersPage />} />
                <Route path="/approvals" element={<ApprovalsPage />} />
              </Route>
              <Route element={<RoleProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.RETAILER_ADMIN, ROLES.AUDITOR]} />}>
                <Route path="/audit-logs" element={<AuditLogsPage />} />
              </Route>
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
