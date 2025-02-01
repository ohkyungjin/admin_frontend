import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from './pages/auth/LoginPage';
import { CreateAdminPage } from './pages/auth/CreateAdminPage';
import { AccountManagementPage } from './pages/account/AccountManagementPage';
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { CategoryManagementPage } from './pages/inventory/CategoryManagementPage';
import { SupplierManagementPage } from './pages/inventory/SupplierManagementPage';
import { ItemManagementPage } from './pages/inventory/ItemManagementPage';
import { MovementManagementPage } from './pages/inventory/MovementManagementPage';
import { OrderManagementPage } from './pages/inventory/OrderManagementPage';
import { DashboardLayout } from './components/layout/DashboardLayout';

const PrivateRoute = ({ children }) => {
  const isAuthenticated = !!localStorage.getItem('access_token');
  return isAuthenticated ? (
    <DashboardLayout>
      {children}
    </DashboardLayout>
  ) : (
    <Navigate to="/login" />
  );
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/create-admin" element={<CreateAdminPage />} />
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <DashboardPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/account/management"
          element={
            <PrivateRoute>
              <AccountManagementPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/inventory/categories"
          element={
            <PrivateRoute>
              <CategoryManagementPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/inventory/suppliers"
          element={
            <PrivateRoute>
              <SupplierManagementPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/inventory/items"
          element={
            <PrivateRoute>
              <ItemManagementPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/inventory/movements"
          element={
            <PrivateRoute>
              <MovementManagementPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/inventory/orders"
          element={
            <PrivateRoute>
              <OrderManagementPage />
            </PrivateRoute>
          }
        />
        <Route path="/" element={<Navigate to="/dashboard" />} />
      </Routes>
    </Router>
  );
}

export default App;
