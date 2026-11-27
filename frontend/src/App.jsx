import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import Navbar from './components/Navbar';

// Auth Pages
import Login from './pages/Login';
import Register from './pages/Register';

// Student Pages
import StudentDashboard from './pages/student/StudentDashboard';
import CourseAssignments from './pages/student/CourseAssignments';
import StudentAssignments from './pages/student/StudentAssignments';
import StudentGroups from './pages/student/StudentGroups';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminAssignments from './pages/admin/AdminAssignments';
import AdminSubmissions from './pages/admin/AdminSubmissions';
import AdminAnalytics from './pages/admin/AdminAnalytics';

// Protected Route Component
function ProtectedRoute({ children, allowedRoles }) {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-400 text-sm">
        Authenticating session...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    // If student tries to visit admin page or vice-versa, redirect appropriately
    return <Navigate to={user?.role === 'admin' ? '/admin/dashboard' : '/student/dashboard'} replace />;
  }

  return children;
}

// Root Route Redirector
function RootRedirect() {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-400 text-sm">
        Loading Joineazy...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Navigate to={user?.role === 'admin' ? '/admin/dashboard' : '/student/dashboard'} replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <div className="min-h-screen bg-slate-50 flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
            <Navbar />
            <main className="flex-1">
              <Routes>
                {/* Public Routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* Student Routes */}
                <Route
                  path="/student/dashboard"
                  element={
                    <ProtectedRoute allowedRoles={['student']}>
                      <StudentDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/student/courses/:courseId"
                  element={
                    <ProtectedRoute allowedRoles={['student']}>
                      <CourseAssignments />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/student/assignments"
                  element={
                    <ProtectedRoute allowedRoles={['student']}>
                      <StudentAssignments />
                    </ProtectedRoute>
                  }
                />
              <Route
                path="/student/groups"
                element={
                  <ProtectedRoute allowedRoles={['student']}>
                    <StudentGroups />
                  </ProtectedRoute>
                }
              />

              {/* Admin / Professor Routes */}
              <Route
                path="/admin/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/assignments"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminAssignments />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/submissions"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminSubmissions />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/analytics"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminAnalytics />
                  </ProtectedRoute>
                }
              />

              {/* Root & Fallback */}
              <Route path="/" element={<RootRedirect />} />
              <Route path="*" element={<RootRedirect />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}
