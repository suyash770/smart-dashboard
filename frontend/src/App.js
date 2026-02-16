import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import AddData from './pages/AddData';
import Predictions from './pages/Predictions';
import Profile from './pages/Profile';
import ManageData from './pages/ManageData';
import './index.css';

// Protected route wrapper
function ProtectedRoute({ children }) {
  const { token, loading } = useAuth();
  if (loading) return null;
  return token ? children : <Navigate to="/login" />;
}

// Redirect if already logged in
function GuestRoute({ children }) {
  const { token, loading } = useAuth();
  if (loading) return null;
  return token ? <Navigate to="/" /> : children;
}

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <BrowserRouter>
          <Routes>
            {/* Auth pages (no sidebar) */}
            <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
            <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />

            {/* Dashboard pages (with sidebar) */}
            <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/add-data" element={<AddData />} />
              <Route path="/predictions" element={<Predictions />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/manage-data" element={<ManageData />} />
            </Route>

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
