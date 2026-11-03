import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/auth/auth-context';
import { ProtectedRoute } from '@/auth/ProtectedRoute';
import { AppLayout } from '@/components/AppLayout';
import { ComingSoon } from '@/components/ComingSoon';
import { LoginPage } from '@/pages/LoginPage';
import { CustomersPage } from '@/pages/customers/CustomersPage';
import { ProjectsPage } from '@/pages/projects/ProjectsPage';
import { ProjectDetailPage } from '@/pages/projects/ProjectDetailPage';
import { NotFoundPage } from '@/pages/NotFoundPage';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
});

export const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/" element={<ComingSoon title="Home" />} />
              <Route path="/proforma" element={<ComingSoon title="Proforma Invoice" />} />
              <Route path="/orders" element={<ComingSoon title="My Orders" />} />
              <Route path="/invoices" element={<ComingSoon title="Tax Invoices" />} />
              <Route path="/warranty" element={<ComingSoon title="Warranty Cards" />} />
              <Route path="/design" element={<ComingSoon title="Create Your Design" />} />
              <Route path="/projects" element={<ProjectsPage />} />
              <Route path="/projects/:id" element={<ProjectDetailPage />} />
              <Route path="/customers" element={<CustomersPage />} />
              <Route path="/estimates" element={<ComingSoon title="Estimates" />} />
              <Route path="/masters" element={<ComingSoon title="Masters" />} />
              <Route path="/settings" element={<ComingSoon title="Settings" />} />
            </Route>
          </Route>
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </QueryClientProvider>
);
