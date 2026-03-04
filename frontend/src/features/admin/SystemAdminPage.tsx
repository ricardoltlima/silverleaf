import { Link } from "react-router-dom";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchCurrentUser } from "@/features/users/currentUserApi";
import { isSystemAdmin } from "@/features/users/roleUtils";
import { fetchHousesForHoaDesk, fetchManagedResidents } from "@/features/hoa/hoaApi";
import { fetchAllViolations, fetchBroadcasts, fetchNews, fetchPolls } from "@/features/board/boardApi";

function StatCard({
  label,
  value,
  tone
}: {
  label: string;
  value: string;
  tone: "leaf" | "blue" | "violet" | "rose";
}) {
  const tones = {
    leaf: "bg-leaf-50 text-leaf-900 border-leaf-200",
    blue: "bg-blue-50 text-blue-900 border-blue-200",
    violet: "bg-violet-50 text-violet-900 border-violet-200",
    rose: "bg-rose-50 text-rose-900 border-rose-200"
  };

  return (
    <article className={`rounded-2xl border p-4 ${tones[tone]}`}>
      <p className="text-xs font-semibold uppercase tracking-wide opacity-70">{label}</p>
      <p className="mt-2 text-3xl font-semibold">{value}</p>
    </article>
  );
}

export function SystemAdminPage() {
  const meQuery = useQuery({ queryKey: ["me"], queryFn: fetchCurrentUser });
  const canAccess = isSystemAdmin(meQuery.data?.role);

  const housesQuery = useQuery({
    queryKey: ["system-admin", "houses"],
    queryFn: fetchHousesForHoaDesk,
    enabled: canAccess
  });
  const residentsQuery = useQuery({
    queryKey: ["system-admin", "residents"],
    queryFn: () => fetchManagedResidents(""),
    enabled: canAccess
  });
  const violationsQuery = useQuery({
    queryKey: ["system-admin", "violations"],
    queryFn: fetchAllViolations,
    enabled: canAccess
  });
  const newsQuery = useQuery({
    queryKey: ["system-admin", "news"],
    queryFn: fetchNews,
    enabled: canAccess
  });
  const broadcastsQuery = useQuery({
    queryKey: ["system-admin", "broadcasts"],
    queryFn: fetchBroadcasts,
    enabled: canAccess
  });
  const pollsQuery = useQuery({
    queryKey: ["system-admin", "polls"],
    queryFn: fetchPolls,
    enabled: canAccess
  });

  const stats = useMemo(() => {
    const houses = housesQuery.data ?? [];
    const residents = residentsQuery.data ?? [];
    const violations = violationsQuery.data ?? [];
    return {
      houses: houses.length,
      occupiedHouses: houses.filter((house) => house.status === "OCCUPIED").length,
      residents: residents.length,
      tenants: residents.filter((resident) => resident.role === "TENANT").length,
      hoaAdmins: residents.filter((resident) => resident.role === "HOA_ADMIN").length,
      openViolations: violations.filter((violation) => violation.status === "OPEN").length
    };
  }, [housesQuery.data, residentsQuery.data, violationsQuery.data]);

  if (!canAccess) {
    return <section className="card p-4 text-sm text-rose-700">Only system admins can access this workspace.</section>;
  }

  return (
    <div className="space-y-4">
      <section className="card overflow-hidden p-0">
        <div className="bg-[linear-gradient(120deg,_#0f172a_0%,_#1d4ed8_46%,_#38bdf8_100%)] px-6 py-6 text-white">
          <div className="mb-2 inline-flex rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white/90">
            System Admin
          </div>
          <h2 className="text-2xl font-semibold">Platform Control Center</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-white/80">
            This screen is the start of the system-level workspace. Right now the platform is still in single-community
            mode, so this page surfaces operational visibility, admin shortcuts, and the areas we will expand next:
            communities, reports, and graphics.
          </p>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Communities" value="1" tone="blue" />
        <StatCard label="Homes" value={String(stats.houses)} tone="leaf" />
        <StatCard label="Members" value={String(stats.residents)} tone="violet" />
        <StatCard label="Open Violations" value={String(stats.openViolations)} tone="rose" />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="card p-4">
          <h3 className="text-base font-semibold text-slate-900">Current operational view</h3>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Community occupancy</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">
                {stats.occupiedHouses} / {stats.houses}
              </p>
              <p className="mt-1 text-sm text-slate-600">Occupied houses in the current Silverleaf community.</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Role distribution</p>
              <p className="mt-2 text-sm text-slate-700">
                Residents: <span className="font-semibold">{stats.residents - stats.tenants - stats.hoaAdmins}</span>
              </p>
              <p className="mt-1 text-sm text-slate-700">
                Tenants: <span className="font-semibold">{stats.tenants}</span>
              </p>
              <p className="mt-1 text-sm text-slate-700">
                Global HOA Admins: <span className="font-semibold">{stats.hoaAdmins}</span>
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Board content</p>
              <p className="mt-2 text-sm text-slate-700">
                News posts: <span className="font-semibold">{newsQuery.data?.length ?? 0}</span>
              </p>
              <p className="mt-1 text-sm text-slate-700">
                Broadcasts: <span className="font-semibold">{broadcastsQuery.data?.length ?? 0}</span>
              </p>
              <p className="mt-1 text-sm text-slate-700">
                Active polls: <span className="font-semibold">{pollsQuery.data?.filter((poll) => poll.active).length ?? 0}</span>
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Next system modules</p>
              <p className="mt-2 text-sm text-slate-700">1. Multi-community management</p>
              <p className="mt-1 text-sm text-slate-700">2. Reporting and dashboards</p>
              <p className="mt-1 text-sm text-slate-700">3. Cross-community analytics</p>
            </div>
          </div>
        </section>

        <section className="card p-4">
          <h3 className="text-base font-semibold text-slate-900">Admin shortcuts</h3>
          <div className="mt-4 space-y-3">
            <Link
              to="/hoa/workspace"
              className="block rounded-xl border border-slate-200 bg-slate-50 p-4 transition hover:bg-slate-100"
            >
              <p className="text-sm font-semibold text-slate-900">HOA Workspace</p>
              <p className="mt-1 text-sm text-slate-600">Invite residents and tenants, manage roles, and operate the community desk.</p>
            </Link>
            <Link
              to="/violations"
              className="block rounded-xl border border-slate-200 bg-slate-50 p-4 transition hover:bg-slate-100"
            >
              <p className="text-sm font-semibold text-slate-900">Violations Feed</p>
              <p className="mt-1 text-sm text-slate-600">Review the latest resident reports and current violation workload.</p>
            </Link>
            <Link
              to="/board/news"
              className="block rounded-xl border border-slate-200 bg-slate-50 p-4 transition hover:bg-slate-100"
            >
              <p className="text-sm font-semibold text-slate-900">Board Publishing</p>
              <p className="mt-1 text-sm text-slate-600">Control news, broadcasts, and HOA poll operations from one place.</p>
            </Link>
          </div>
        </section>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <article className="card p-4">
          <h3 className="text-base font-semibold text-slate-900">Communities</h3>
          <p className="mt-2 text-sm text-slate-600">
            The platform still operates in single-community mode. The next backend step here is a `community` table plus
            scoping all houses, residents, and HOA resources to that community.
          </p>
        </article>
        <article className="card p-4">
          <h3 className="text-base font-semibold text-slate-900">Reports</h3>
          <p className="mt-2 text-sm text-slate-600">
            We can add exportable reports for occupancy, engagement, violations, messaging usage, and invite conversion.
          </p>
        </article>
        <article className="card p-4">
          <h3 className="text-base font-semibold text-slate-900">Graphics</h3>
          <p className="mt-2 text-sm text-slate-600">
            Once we define the system metrics, this page can grow into a proper dashboard with trends, charts, and admin alerts.
          </p>
        </article>
      </section>
    </div>
  );
}
