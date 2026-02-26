import { Navigate, Route, Routes } from "react-router-dom";
import type { ReactElement } from "react";
import { LoginPage } from "@/features/auth/LoginPage";
import { AppShell } from "@/features/layout/AppShell";
import { CommunityPage } from "@/features/sections/CommunityPage";
import { ServicesPage } from "@/features/sections/ServicesPage";
import { GarageSalesPage } from "@/features/sections/GarageSalesPage";
import { AlertsPage } from "@/features/sections/AlertsPage";
import { ReservationsPage } from "@/features/sections/ReservationsPage";
import { ProfilePage } from "@/features/profile/ProfilePage";
import { MapPage } from "@/features/map/MapPage";
import { MessagesPage } from "@/features/messages/MessagesPage";
import { getAccessToken } from "@/lib/authStorage";

function Protected({ children }: { children: ReactElement }) {
  const token = getAccessToken();
  if (!token) {
    window.location.replace("/");
    return null;
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
        <Route path="reservations" element={<ReservationsPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="map" element={<MapPage />} />
        <Route path="messages" element={<MessagesPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/community" replace />} />
    </Routes>
  );
}
