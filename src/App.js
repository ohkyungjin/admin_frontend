import React from 'react';
import 'antd/dist/reset.css';
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
import { PackageManagementPage } from './pages/funeral/PackageManagementPage';
import { PremiumLineManagementPage } from './pages/funeral/PremiumLineManagementPage';
import { AdditionalOptionsPage } from './pages/funeral/AdditionalOptionsPage';
import { ReservationManagementPage } from './pages/reservation/ReservationManagementPage';
import { MemorialRoomManagementPage } from './pages/memorial/MemorialRoomManagementPage';

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
        <Route
          path="/funeral/packages"
          element={
            <PrivateRoute>
              <PackageManagementPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/funeral/premium-lines"
          element={
            <PrivateRoute>
              <PremiumLineManagementPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/funeral/additional-options"
          element={
            <PrivateRoute>
              <AdditionalOptionsPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/reservations"
          element={
            <PrivateRoute>
              <ReservationManagementPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/reservations/memorial-rooms"
          element={
            <PrivateRoute>
              <MemorialRoomManagementPage />
            </PrivateRoute>
          }
        />
        <Route path="/" element={<Navigate to="/dashboard" />} />
      </Routes>
    </Router>
  );
}

export default App;
