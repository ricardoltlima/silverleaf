import { FormEvent, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { login } from "@/features/auth/authApi";
import { setTokens } from "@/lib/authStorage";

export function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("ricardoltlima@gmail.com");
  const [password, setPassword] = useState("myPassw0rd!");

  const loginMutation = useMutation({
    mutationFn: login,
    onSuccess: (result) => {
      setTokens(result.accessToken, result.refreshToken);
      navigate("/feed", { replace: true });
    }
  });

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    loginMutation.mutate({ email: email.trim(), password });
  };

  return (
    <main className="mx-auto grid min-h-screen w-full max-w-md place-items-center px-4">
      <section className="card w-full p-6">
        <div className="mb-6 flex items-center gap-3">
          <img src="/silverleaf-icon.svg" alt="Silverleaf" className="h-10 w-10 rounded-lg" />
          <div>
            <h1 className="text-xl font-semibold text-leaf-900">Silverleaf Reserve</h1>
            <p className="text-sm text-slate-500">Login to access the resident portal.</p>
          </div>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-slate-700">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none ring-leaf-600 focus:ring-2"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium text-slate-700">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none ring-leaf-600 focus:ring-2"
              required
            />
          </div>

          {loginMutation.isError ? (
            <p className="text-sm text-red-600">{(loginMutation.error as Error).message}</p>
          ) : null}

          <button
            type="submit"
            disabled={loginMutation.isPending}
            className="w-full rounded-lg bg-leaf-600 px-4 py-2 font-medium text-white transition hover:bg-leaf-700 disabled:opacity-70"
          >
            {loginMutation.isPending ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </section>
    </main>
  );
}
