import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import AdminDashboard from "./pages/AdminDashboard";
import AddExpense from "./pages/AddExpense";
import EditExpense from "./pages/EditExpense";

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (adminOnly && user.role !== "admin") {
    return <Navigate to="/dashboard" />;
  }

  return children;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
           
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/admin"
              element={
                <ProtectedRoute adminOnly={true}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/add-expense"
              element={
                <ProtectedRoute>
                  <AddExpense />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/edit-expense/:id"
              element={
                <ProtectedRoute>
                  <EditExpense />
                </ProtectedRoute>
              }
            />
            
            {/* Root redirect */}
            <Route path="/" element={<Navigate to="/dashboard" />} />
            
            {/* Catch all route */}
            <Route path="*" element={<Navigate to="/dashboard" />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;