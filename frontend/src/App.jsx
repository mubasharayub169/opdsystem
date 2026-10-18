import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import ReceptionistLogin from './pages/ReceptionistLogin';
import ReceptionistDashboard from './pages/ReceptionistDashboard';
import DoctorLogin from './pages/DoctorLogin';
import DoctorDashboard from './pages/DoctorDashboard';
import Templates from './pages/Templates';
import Prescription from './pages/Prescription';
import Dashboard from './pages/Dashboard';
import Doctors from './pages/Doctors';
import Receptionists from './pages/Receptionists';
import Medicines from './pages/Medicines';
import ChangePassword from './pages/ChangePassword';
import Settings from './pages/Settings';
import { useAuth } from './store/auth';

function PrivateRoute({ children, role }) {
  const { token, user } = useAuth();

  if (!token) {
    if (role === 'receptionist') return <Navigate to="/receptionist/login" />;
    if (role === 'doctor') return <Navigate to="/doctor/login" />;
    return <Navigate to="/login" />;
  }

  if (role && user?.role !== role) {
    if (user?.role === 'receptionist') return <Navigate to="/receptionist" />;
    if (user?.role === 'doctor') return <Navigate to="/doctor" />;
    if (user?.role === 'admin') return <Navigate to="/" />;
    return <Navigate to="/login" />;
  }

  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ============================================================
            PUBLIC ROUTES
        ============================================================ */}
        <Route path="/login" element={<Login />} />
        <Route path="/receptionist/login" element={<ReceptionistLogin />} />
        <Route path="/doctor/login" element={<DoctorLogin />} />

        {/* ============================================================
            ADMIN ROUTES
        ============================================================ */}
        <Route
          path="/"
          element={
            <PrivateRoute role="admin">
              <Dashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/doctors"
          element={
            <PrivateRoute role="admin">
              <Doctors />
            </PrivateRoute>
          }
        />
        <Route
          path="/receptionists"
          element={
            <PrivateRoute role="admin">
              <Receptionists />
            </PrivateRoute>
          }
        />
        <Route
          path="/medicines"
          element={
            <PrivateRoute role="admin">
              <Medicines />
            </PrivateRoute>
          }
        />
        <Route
          path="/change-password"
          element={
            <PrivateRoute role="admin">
              <ChangePassword />
            </PrivateRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <PrivateRoute role="admin">
              <Settings />
            </PrivateRoute>
          }
        />

        {/* ============================================================
            RECEPTIONIST ROUTES
        ============================================================ */}
        <Route
          path="/receptionist"
          element={
            <PrivateRoute role="receptionist">
              <ReceptionistDashboard />
            </PrivateRoute>
          }
        />

        {/* ============================================================
            DOCTOR ROUTES
        ============================================================ */}
        <Route
          path="/doctor"
          element={
            <PrivateRoute role="doctor">
              <DoctorDashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/doctor/templates"
          element={
            <PrivateRoute role="doctor">
              <Templates />
            </PrivateRoute>
          }
        />
        <Route
          path="/doctor/prescription/:visitId"
          element={
            <PrivateRoute role="doctor">
              <Prescription />
            </PrivateRoute>
          }
        />

        {/* ============================================================
            FALLBACK
        ============================================================ */}
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}