import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import ProtectedRoute from './components/ProtectedRoute';

import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/author/DashboardPage';
import BooksPage from './pages/author/BooksPage';
import NewTicketPage from './pages/author/NewTicketPage';
import MyTicketsPage from './pages/author/MyTicketsPage';
import AuthorTicketDetailPage from './pages/author/TicketDetailPage';

import AdminQueuePage from './pages/admin/AdminQueuePage';
import AdminTicketDetailPage from './pages/admin/AdminTicketDetailPage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            {/* Public */}
            <Route path="/login" element={<LoginPage />} />

            {/* Author routes */}
            <Route path="/dashboard" element={<ProtectedRoute role="author"><DashboardPage /></ProtectedRoute>} />
            <Route path="/books" element={<ProtectedRoute role="author"><BooksPage /></ProtectedRoute>} />
            <Route path="/tickets/new" element={<ProtectedRoute role="author"><NewTicketPage /></ProtectedRoute>} />
            <Route path="/tickets" element={<ProtectedRoute role="author"><MyTicketsPage /></ProtectedRoute>} />
            <Route path="/tickets/:ticketId" element={<ProtectedRoute role="author"><AuthorTicketDetailPage /></ProtectedRoute>} />

            {/* Admin routes */}
            <Route path="/admin" element={<ProtectedRoute role="admin"><AdminQueuePage /></ProtectedRoute>} />
            <Route path="/admin/tickets/:ticketId" element={<ProtectedRoute role="admin"><AdminTicketDetailPage /></ProtectedRoute>} />

            {/* Root redirect */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
