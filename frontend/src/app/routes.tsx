import React, { Suspense, lazy } from "react";
import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import type { ReactElement } from "react";
import { LoginPage } from "@/features/auth/LoginPage";
import { AppShell } from "@/features/layout/AppShell";
import { getAccessToken } from "@/lib/authStorage";

const CommunityPage = lazy(() => import("@/features/sections/CommunityPage").then((module) => ({ default: module.CommunityPage })));
const ServicesPage = lazy(() => import("@/features/sections/ServicesPage").then((module) => ({ default: module.ServicesPage })));
const GarageSalesPage = lazy(() => import("@/features/sections/GarageSalesPage").then((module) => ({ default: module.GarageSalesPage })));
const AlertsPage = lazy(() => import("@/features/sections/AlertsPage").then((module) => ({ default: module.AlertsPage })));
const GroupsPage = lazy(() => import("@/features/sections/GroupsPage").then((module) => ({ default: module.GroupsPage })));
const ReservationsPage = lazy(() => import("@/features/sections/ReservationsPage").then((module) => ({ default: module.ReservationsPage })));
const ReportViolationPage = lazy(() => import("@/features/sections/ReportViolationPage").then((module) => ({ default: module.ReportViolationPage })));
const ViolationsPage = lazy(() => import("@/features/sections/ViolationsPage").then((module) => ({ default: module.ViolationsPage })));
const ProfilePage = lazy(() => import("@/features/profile/ProfilePage").then((module) => ({ default: module.ProfilePage })));
const MessagesPage = lazy(() => import("@/features/messages/MessagesPage").then((module) => ({ default: module.MessagesPage })));
const NeighborsPage = lazy(() => import("@/features/neighbors/NeighborsPage").then((module) => ({ default: module.NeighborsPage })));
const NeighborProfilePage = lazy(() => import("@/features/neighbors/NeighborProfilePage").then((module) => ({ default: module.NeighborProfilePage })));
const BoardNewsPage = lazy(() => import("@/features/board/BoardNewsPage").then((module) => ({ default: module.BoardNewsPage })));
const BoardBroadcastsPage = lazy(() => import("@/features/board/BoardBroadcastsPage").then((module) => ({ default: module.BoardBroadcastsPage })));
const BoardPollsPage = lazy(() => import("@/features/board/BoardPollsPage").then((module) => ({ default: module.BoardPollsPage })));
const BoardReportsPage = lazy(() => import("@/features/board/BoardReportsPage").then((module) => ({ default: module.BoardReportsPage })));
const HoaWorkspacePage = lazy(() => import("@/features/hoa/HoaWorkspacePage").then((module) => ({ default: module.HoaWorkspacePage })));
const SystemAdminPage = lazy(() => import("@/features/admin/SystemAdminPage").then((module) => ({ default: module.SystemAdminPage })));

function Protected({ children }: { children: ReactElement }) {
  const token = getAccessToken();
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function SuspendedOutlet() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen">Loading...</div>}>
      <Outlet />
    </Suspense>
  );
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <Protected>
            <AppShell />
          </Protected>
        }
      >
        <Route element={<SuspendedOutlet />}>
          <Route index element={<Navigate to="/community" replace />} />
          <Route path="feed" element={<Navigate to="/community" replace />} />
          <Route path="community" element={<CommunityPage />} />
          <Route path="services" element={<ServicesPage />} />
          <Route path="garage-sales" element={<GarageSalesPage />} />
          <Route path="alerts" element={<AlertsPage />} />
          <Route path="groups" element={<GroupsPage />} />
          <Route path="neighbors" element={<NeighborsPage />} />
          <Route path="neighbors/:neighborId" element={<NeighborProfilePage />} />
          <Route path="reservations" element={<ReservationsPage />} />
          <Route path="report-violation" element={<ReportViolationPage />} />
          <Route path="violations" element={<ViolationsPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="messages" element={<MessagesPage />} />
          <Route path="board/news" element={<BoardNewsPage />} />
          <Route path="board/broadcasts" element={<BoardBroadcastsPage />} />
          <Route path="board/polls" element={<BoardPollsPage />} />
          <Route path="board/reports" element={<BoardReportsPage />} />
          <Route path="hoa/workspace" element={<HoaWorkspacePage />} />
          <Route path="system-admin" element={<SystemAdminPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to={getAccessToken() ? "/community" : "/login"} replace />} />
    </Routes>
  );
}
