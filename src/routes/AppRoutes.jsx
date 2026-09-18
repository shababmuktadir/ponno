import { Routes, Route, Navigate } from "react-router-dom";
import { ProtectedRoute, AdminRoute, GuestRoute } from "./guards";
import AuthLayout from "@/layouts/AuthLayout";
import DashboardLayout from "@/layouts/DashboardLayout";
import AdminLayout from "@/admin/layouts/AdminLayout";

import Login from "@/pages/auth/Login";
import Signup from "@/pages/auth/Signup";
import ForgotPassword from "@/pages/auth/ForgotPassword";
import VerifyEmail from "@/pages/auth/VerifyEmail";
import Suspended from "@/pages/auth/Suspended";
import NotFound from "@/pages/NotFound";

import Dashboard from "@/pages/dashboard/Dashboard";
import Placeholder from "@/pages/Placeholder";

import AccessDenied from "@/admin/pages/AccessDenied";
import AdminDashboard from "@/admin/pages/AdminDashboard";
import PendingUsers from "@/admin/pages/PendingUsers";
import Users from "@/admin/pages/Users";
import UserDetail from "@/admin/pages/UserDetail";
import Staff from "@/admin/pages/Staff";
import Packages from "@/admin/pages/Packages";
import Subscriptions from "@/admin/pages/Subscriptions";
import Earnings from "@/admin/pages/Earnings";
import Usage from "@/admin/pages/Usage";
import UserSearch from "@/admin/pages/UserSearch";
import Notifications from "@/admin/pages/Notifications";
import AdminChat from "@/admin/pages/Chat";
import Reports from "@/admin/pages/Reports";
import AuditLogs from "@/admin/pages/AuditLogs";
import AdminSettings from "@/admin/pages/AdminSettings";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* ---------- Auth (single login) ---------- */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
        <Route path="/signup" element={<GuestRoute><Signup /></GuestRoute>} />
        <Route path="/forgot-password" element={<GuestRoute><ForgotPassword /></GuestRoute>} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/suspended" element={<Suspended />} />
      </Route>

      {/* ---------- User App ---------- */}
      <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/products/*" element={<Placeholder title="প্রোডাক্ট" />} />
        <Route path="/categories" element={<Placeholder title="ক্যাটাগরি" />} />
        <Route path="/stock" element={<Placeholder title="স্টক" />} />
        <Route path="/stock/dashboard" element={<Placeholder title="স্টক ড্যাশবোর্ড" />} />
        <Route path="/earnings" element={<Placeholder title="আয়" />} />
        <Route path="/reports" element={<Placeholder title="রিপোর্ট" />} />
        <Route path="/invoices/*" element={<Placeholder title="ইনভয়েস" />} />
        <Route path="/customers" element={<Placeholder title="কাস্টমার" />} />
        <Route path="/team" element={<Placeholder title="ইউজার" />} />
        <Route path="/sms" element={<Placeholder title="এসএমএস" />} />
        <Route path="/chat" element={<Placeholder title="চ্যাট" />} />
        <Route path="/notifications" element={<Placeholder title="নোটিফিকেশন" />} />
        <Route path="/settings" element={<Placeholder title="সেটিংস" />} />
      </Route>

      {/* ---------- Admin ---------- */}
      <Route path="/admin">
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="denied" element={<AccessDenied />} />

        <Route element={<AdminRoute><AdminLayout /></AdminRoute>}>
          <Route path="dashboard" element={<AdminDashboard />} />

          <Route path="pending-users" element={
            <AdminRoute permission="users.approve"><PendingUsers /></AdminRoute>
          } />

          <Route path="users" element={
            <AdminRoute permission="users.view"><Users /></AdminRoute>
          } />
          <Route path="users/:uid" element={
            <AdminRoute permission="users.view"><UserDetail /></AdminRoute>
          } />

          <Route path="staff" element={
            <AdminRoute permission="staff.manage"><Staff /></AdminRoute>
          } />

          <Route path="packages" element={
            <AdminRoute permission="packages.view"><Packages /></AdminRoute>
          } />

          <Route path="subscriptions" element={
            <AdminRoute permission="subscriptions.view"><Subscriptions /></AdminRoute>
          } />

          <Route path="earnings" element={
            <AdminRoute permission="earnings.view"><Earnings /></AdminRoute>
          } />

          <Route path="usage" element={
            <AdminRoute permission="usage.view"><Usage /></AdminRoute>
          } />

          <Route path="search" element={
            <AdminRoute permission="users.view"><UserSearch /></AdminRoute>
          } />

          <Route path="notifications" element={
            <AdminRoute permission="notifications.view"><Notifications /></AdminRoute>
          } />

          <Route path="chat" element={
            <AdminRoute permission="chat.view"><AdminChat /></AdminRoute>
          } />

          <Route path="reports" element={
            <AdminRoute permission="reports.view"><Reports /></AdminRoute>
          } />

          <Route path="audit" element={
            <AdminRoute permission="audit.view"><AuditLogs /></AdminRoute>
          } />

          <Route path="settings" element={
            <AdminRoute permission="settings.view"><AdminSettings /></AdminRoute>
          } />
        </Route>
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}