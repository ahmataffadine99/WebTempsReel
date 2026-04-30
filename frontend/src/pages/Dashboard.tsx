import React from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { Navigate } from 'react-router-dom';

export const Dashboard = () => {
  const { user, isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white p-8">
      <h1 className="text-3xl font-bold text-blue-400">Banque AVENIR - Dashboard</h1>
      <p className="mt-4 text-slate-300">Bienvenue, {user?.firstName} {user?.lastName} ({user?.role})</p>
    </div>
  );
};
