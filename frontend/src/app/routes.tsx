import { Navigate, Route, Routes } from "react-router-dom";
import type { ReactElement } from "react";
import { LoginPage } from "@/features/auth/LoginPage";
import { AppShell } from "@/features/layout/AppShell";
import { CommunityPage } from "@/features/sections/CommunityPage";
import { ServicesPage } from "@/features/sections/ServicesPage";
import { GarageSalesPage } from "@/features/sections/GarageSalesPage";
import { AlertsPage } from "@/features/sections/AlertsPage";
import { GroupsPage } from "@/features/sections/GroupsPage";
import { ReservationsPage } from "@/features/sections/ReservationsPage";
import { ReportViolationPage } from "@/features/sections/ReportViolationPage";
import { ViolationsPage } from "@/features/sections/ViolationsPage";
import { ProfilePage } from "@/features/profile/ProfilePage";
import { MessagesPage } from "@/features/messages/MessagesPage";
import { NeighborsPage } from "@/features/neighbors/NeighborsPage";
import { NeighborProfilePage } from "@/features/neighbors/NeighborProfilePage";
import { BoardNewsPage } from "@/features/board/BoardNewsPage";
import { BoardBroadcastsPage } from "@/features/board/BoardBroadcastsPage";
import { BoardPollsPage } from "@/features/board/BoardPollsPage";
import { BoardReportsPage } from "@/features/board/BoardReportsPage";
import { HoaWorkspacePage } from "@/features/hoa/HoaWorkspacePage";
import { SystemAdminPage } from "@/features/admin/SystemAdminPage";
import { getAccessToken } from "@/lib/authStorage";

function Protected({ children }: { children: ReactElement }) {
  const token = getAccessToken();
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
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
      <Route path="*" element={<Navigate to={getAccessToken() ? "/community" : "/login"} replace />} />
    </Routes>
  );
}
