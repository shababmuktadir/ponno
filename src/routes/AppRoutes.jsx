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

import Chat from "@/pages/chat/Chat";
import Dashboard from "@/pages/dashboard/Dashboard";
import Products from "@/pages/products/Products";
import Categories from "@/pages/categories/Categories";
import Stock from "@/pages/stock/Stock";
import StockDashboard from "@/pages/stock/StockDashboard";
import Earnings from "@/pages/earnings/Earnings";
import Customers from "@/pages/customers/Customers";
import Invoices from "@/pages/invoices/Invoices";
import InvoiceEditor from "@/pages/invoices/InvoiceEditor";
import Reports from "@/pages/reports/Reports";
import Sms from "@/pages/sms/Sms";
import Team from "@/pages/team/Team";
import UserNotifications from "@/pages/notifications/Notifications";
import Placeholder from "@/pages/Placeholder";
import UserSettings from "@/pages/settings/UserSettings";

import AccessDenied from "@/admin/pages/AccessDenied";
import AdminDashboard from "@/admin/pages/AdminDashboard";
import PendingUsers from "@/admin/pages/PendingUsers";
import Users from "@/admin/pages/Users";
import UserDetail from "@/admin/pages/UserDetail";
import Staff from "@/admin/pages/Staff";
import Packages from "@/admin/pages/Packages";
import PackageEditor from "@/admin/pages/PackageEditor";
import PricingSettings from "@/admin/pages/PricingSettings";
import Subscriptions from "@/admin/pages/Subscriptions";
import AdminEarnings from "@/admin/pages/Earnings";
import Usage from "@/admin/pages/Usage";
import UserSearch from "@/admin/pages/UserSearch";
import AdminNotifications from "@/admin/pages/Notifications";
import AdminChat from "@/admin/pages/Chat";
import AdminReports from "@/admin/pages/Reports";
import AuditLogs from "@/admin/pages/AuditLogs";
import AdminSettings from "@/admin/pages/AdminSettings";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* ---------- Auth ---------- */}
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
        <Route path="/products" element={<Products />} />
        <Route path="/categories" element={<Categories />} />
        <Route path="/stock" element={<Stock />} />
        <Route path="/stock/dashboard" element={<StockDashboard />} />
        <Route path="/earnings" element={<Earnings />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/invoices" element={<Invoices />} />
        <Route path="/invoices/new" element={<InvoiceEditor />} />
        <Route path="/invoices/:id" element={<InvoiceEditor />} />
        <Route path="/customers" element={<Customers />} />
        <Route path="/sms" element={<Sms />} />
        <Route path="/team" element={<Team />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/notifications" element={<UserNotifications />} />
        <Route path="/settings" element={<UserSettings />} />
      </Route>

      {/* ---------- Admin ---------- */}
      <Route path="/admin">
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="denied" element={<AccessDenied />} />

        <Route element={<AdminRoute><AdminLayout /></AdminRoute>}>
          <Route path="dashboard" element={<AdminDashboard />} />

          <Route
            path="pending-users"
            element={
              <AdminRoute permission="users.approve">
                <PendingUsers />
              </AdminRoute>
            }
          />

          <Route
            path="users"
            element={
              <AdminRoute permission="users.view">
                <Users />
              </AdminRoute>
            }
          />
          <Route
            path="users/:uid"
            element={
              <AdminRoute permission="users.view">
                <UserDetail />
              </AdminRoute>
            }
          />

          <Route
            path="staff"
            element={
              <AdminRoute permission="staff.manage">
                <Staff />
              </AdminRoute>
            }
          />

          <Route
            path="packages"
            element={
              <AdminRoute permission="packages.view">
                <Packages />
              </AdminRoute>
            }
          />
          <Route
            path="packages/new"
            element={
              <AdminRoute permission="packages.manage">
                <PackageEditor />
              </AdminRoute>
            }
          />
          <Route
            path="packages/:id"
            element={
              <AdminRoute permission="packages.manage">
                <PackageEditor />
              </AdminRoute>
            }
          />

          <Route
            path="pricing"
            element={
              <AdminRoute permission="packages.manage">
                <PricingSettings />
              </AdminRoute>
            }
          />

          <Route
            path="subscriptions"
            element={
              <AdminRoute permission="subscriptions.view">
                <Subscriptions />
              </AdminRoute>
            }
          />

          <Route
            path="earnings"
            element={
              <AdminRoute permission="earnings.view">
                <AdminEarnings />
              </AdminRoute>
            }
          />

          <Route
            path="usage"
            element={
              <AdminRoute permission="usage.view">
                <Usage />
              </AdminRoute>
            }
          />

          <Route
            path="search"
            element={
              <AdminRoute permission="users.view">
                <UserSearch />
              </AdminRoute>
            }
          />

          <Route
            path="notifications"
            element={
              <AdminRoute permission="notifications.view">
                <AdminNotifications />
              </AdminRoute>
            }
          />

          <Route
            path="chat"
            element={
              <AdminRoute permission="chat.view">
                <AdminChat />
              </AdminRoute>
            }
          />

          <Route
            path="reports"
            element={
              <AdminRoute permission="reports.view">
                <AdminReports />
              </AdminRoute>
            }
          />

          <Route
            path="audit"
            element={
              <AdminRoute permission="audit.view">
                <AuditLogs />
              </AdminRoute>
            }
          />

          <Route
            path="settings"
            element={
              <AdminRoute permission="settings.view">
                <AdminSettings />
              </AdminRoute>
            }
          />
        </Route>
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}