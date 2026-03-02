import { FormEvent, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";
import { acceptResidentInvitation, fetchPublicConfig, fetchPublicHouses, fetchResidentInvitation, login } from "@/features/auth/authApi";
import { getRememberedLogin, setRememberedLogin } from "@/features/auth/loginStorage";
import { setTokens, getAccessToken } from "@/lib/authStorage";
import type { PublicHouse } from "@/features/auth/types";

function findHouseByRemembered(houses: PublicHouse[], rememberedHouseId: number | null, rememberedAddress: string) {
  if (rememberedHouseId !== null) {
    const exact = houses.find((house) => house.id === rememberedHouseId);
    if (exact) return exact;
  }
  return houses.find((house) => house.address === rememberedAddress) ?? null;
}

export function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const remembered = getRememberedLogin();
  const invitationToken = searchParams.get("invite")?.trim() || "";

  const [identifier, setIdentifier] = useState(remembered?.identifier ?? "ricardoltlima@gmail.com");
  const [password, setPassword] = useState("myPassw0rd!");
  const [houseId, setHouseId] = useState<number | "">(remembered?.houseId ?? "");
  const [localMessage, setLocalMessage] = useState<string>("");

  const configQuery = useQuery({ queryKey: ["public", "config"], queryFn: fetchPublicConfig });
  const housesQuery = useQuery({ queryKey: ["public", "houses"], queryFn: fetchPublicHouses });
  const invitationQuery = useQuery({
    queryKey: ["public", "resident-invitation", invitationToken],
    queryFn: () => fetchResidentInvitation(invitationToken),
    enabled: invitationToken.length > 0
  });

  useEffect(() => {
    if (getAccessToken()) {
      navigate("/community", { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    if (!housesQuery.data?.length) return;
    if (houseId !== "" && !invitationQuery.data) return;
    if (invitationQuery.data) {
      const invitedHouse = housesQuery.data.find((house) => house.id === invitationQuery.data?.houseId);
      if (invitedHouse) {
        setHouseId(invitedHouse.id);
      }
      return;
    }
    if (remembered) {
      const matchedHouse = findHouseByRemembered(housesQuery.data, remembered.houseId, remembered.houseAddress);
      if (matchedHouse) {
        setHouseId(matchedHouse.id);
        return;
      }
    }
    setHouseId(housesQuery.data[0].id);
  }, [housesQuery.data, houseId, remembered, invitationQuery.data]);

  useEffect(() => {
    if (!invitationQuery.data) return;
    setIdentifier(invitationQuery.data.email);
  }, [invitationQuery.data]);

  const selectedHouse = useMemo(
    () => housesQuery.data?.find((house) => house.id === houseId) ?? null,
    [housesQuery.data, houseId]
  );

  const loginMutation = useMutation({
    mutationFn: login,
    onSuccess: async (result) => {
      setTokens(result.accessToken, result.refreshToken);
      if (invitationToken) {
        await acceptResidentInvitation(invitationToken);
      }
      if (selectedHouse) {
        setRememberedLogin({
          houseId: selectedHouse.id,
          houseAddress: selectedHouse.address,
          identifier: identifier.trim()
        });
      }
      navigate("/community", { replace: true });
    }
  });

  const hasInvitation = !!invitationQuery.data;

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedIdentifier = identifier.trim().toLowerCase();
    setLocalMessage("");

    if (!normalizedIdentifier) {
      setLocalMessage("Email is required.");
      return;
    }
    if (!normalizedIdentifier.includes("@")) {
      setLocalMessage("Phone login is not wired yet. Use email for now.");
      return;
    }
    if (!password) {
      setLocalMessage("Password is required.");
      return;
    }

    loginMutation.mutate({ email: normalizedIdentifier, password });
  };

  const pending = loginMutation.isPending;
  const errorMessage =
    localMessage ||
    (loginMutation.isError ? (loginMutation.error as Error).message : "") ||
    (invitationQuery.isError ? (invitationQuery.error as Error).message : "") ||
    (invitationQuery.data?.expired ? "This invitation is no longer valid. Contact HOA for a new link." : "");

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(203,213,225,0.7),_transparent_34%),linear-gradient(180deg,_#eef3ec_0%,_#f8faf7_42%,_#f1f5f9_100%)] px-4 py-8">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-6xl gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <section className="px-2 lg:px-8">
          <div className="mb-6 flex items-center gap-3">
            <img src="/silverleaf-icon.svg" alt="Silverleaf" className="h-12 w-12 rounded-2xl shadow-sm" />
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-leaf-700">Silverleaf Reserve</p>
              <h1 className="text-4xl font-semibold tracking-tight text-slate-900 md:text-5xl">
                Neighborhood access, tailored for residents.
              </h1>
            </div>
          </div>
          <p className="max-w-xl text-base leading-7 text-slate-600 md:text-lg">
            Sign in to see community posts, groups, services, garage sales, alerts, and HOA updates. HOA creates
            resident accounts and sends invitation links with the correct address and email already attached.
          </p>
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/70 bg-white/70 p-4 shadow-sm backdrop-blur">
              <p className="text-sm font-semibold text-slate-900">Returning resident</p>
              <p className="mt-1 text-sm text-slate-600">Your last-used address stays selected after logout.</p>
            </div>
            <div className="rounded-2xl border border-white/70 bg-white/70 p-4 shadow-sm backdrop-blur">
              <p className="text-sm font-semibold text-slate-900">First-time resident</p>
              <p className="mt-1 text-sm text-slate-600">Use the invitation link sent by HOA to open your prefilled login page.</p>
            </div>
          </div>
        </section>

        <section className="rounded-[28px] border border-white/80 bg-white/90 p-6 shadow-[0_30px_80px_rgba(15,23,42,0.12)] backdrop-blur lg:p-8">
          <div className="mb-6 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-semibold text-slate-900">Log in</h2>
              <p className="mt-1 text-sm text-slate-500">
                {hasInvitation
                  ? "Your HOA invitation has prefilled your address and email."
                  : "Use your resident credentials. Social login UI is ready for remote auth wiring."}
              </p>
            </div>
            {remembered?.houseAddress ? (
              <div className="rounded-full bg-leaf-50 px-3 py-1 text-xs font-medium text-leaf-800">
                Last address: {remembered.houseAddress}
              </div>
            ) : null}
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label htmlFor="address" className="mb-1 block text-sm font-medium text-slate-700">
                Address
              </label>
              <select
                id="address"
                value={houseId}
                onChange={(event) => setHouseId(Number(event.target.value))}
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none ring-leaf-600 focus:ring-2"
                disabled={hasInvitation || housesQuery.isLoading || !housesQuery.data?.length}
              >
                {housesQuery.data?.map((house) => (
                  <option key={house.id} value={house.id}>
                    {house.address} {house.status === "OCCUPIED" ? "- occupied" : ""}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="identifier" className="mb-1 block text-sm font-medium text-slate-700">
                Email or phone
              </label>
              <input
                id="identifier"
                type="text"
                autoComplete="username"
                value={identifier}
                onChange={(event) => setIdentifier(event.target.value)}
                placeholder="Email address"
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none ring-leaf-600 focus:ring-2"
                disabled={hasInvitation}
                required
              />
              <p className="mt-1 text-xs text-slate-500">Phone login will be wired later. Email works now.</p>
            </div>

            <div>
              <div className="mb-1 flex items-center justify-between gap-2">
                <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                  Password
                </label>
                <button type="button" className="text-xs font-medium text-leaf-700 hover:underline">
                  Forgot password?
                </button>
              </div>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Password"
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none ring-leaf-600 focus:ring-2"
              required
            />
            </div>

            {selectedHouse ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600">
                <span className="font-semibold text-slate-800">Selected address:</span> {selectedHouse.address}
                {hasInvitation ? (
                  <span className="mt-1 block">This address was assigned by HOA for your invitation link.</span>
                ) : (
                  <span className="mt-1 block">Use your HOA-provided credentials or invitation link to continue.</span>
                )}
              </div>
            ) : null}

            {errorMessage ? <p className="text-sm text-rose-700">{errorMessage}</p> : null}

            <button
              type="submit"
              disabled={pending || configQuery.isLoading || housesQuery.isLoading || invitationQuery.isLoading || invitationQuery.data?.expired}
              className="w-full rounded-2xl bg-leaf-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-leaf-700 disabled:opacity-70"
            >
              {pending ? "Signing in..." : "Continue"}
            </button>
          </form>

          <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-[0.2em] text-slate-400">
            <div className="h-px flex-1 bg-slate-200" />
            Or
            <div className="h-px flex-1 bg-slate-200" />
          </div>

          <div className="space-y-3">
            <button
              type="button"
              className="flex w-full items-center justify-center gap-3 rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
            >
              <span className="text-base font-semibold text-rose-500">G</span>
              Continue with Google
            </button>
            <button
              type="button"
              className="flex w-full items-center justify-center gap-3 rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
            >
              <span className="text-base font-semibold text-blue-600">f</span>
              Continue with Facebook
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}
