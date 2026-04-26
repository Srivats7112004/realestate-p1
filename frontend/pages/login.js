import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const router = useRouter();
  const { user, login } = useAuth();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user) {
      router.replace("/profile");
    }
  }, [user, router]);

  const handleChange = (event) => {
    setForm((prev) => ({
      ...prev,
      [event.target.name]: event.target.value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      await login(form);
      router.push("/profile");
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="app-shell min-h-screen">
      <Navbar />

      <main className="app-container py-10 md:py-14">
        <div className="grid items-center gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <section className="animate-fadeIn">
            <div className="page-kicker mb-5">
              <span className="page-dot" />
              Secure account access
            </div>

            <h1 className="mb-4 max-w-2xl text-4xl font-bold tracking-tight text-slate-900 md:text-5xl">
              Sign in to continue your BlockEstate workflow
            </h1>

            <p className="section-subtext max-w-xl text-base md:text-lg">
              Access your profile, connect the correct wallet, and continue managing
              listings, approvals, and escrow-based property transactions.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <div className="soft-stat p-5">
                <div className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                  Access
                </div>
                <div className="text-lg font-bold text-slate-900">
                  Role-based
                </div>
                <p className="mt-2 text-sm text-slate-500">
                  Dashboards adapt to your assigned app role.
                </p>
              </div>

              <div className="soft-stat p-5">
                <div className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                  Wallet
                </div>
                <div className="text-lg font-bold text-sky-700">
                  Linked
                </div>
                <p className="mt-2 text-sm text-slate-500">
                  Use your connected wallet with your user profile.
                </p>
              </div>

              <div className="soft-stat p-5">
                <div className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                  Workflow
                </div>
                <div className="text-lg font-bold text-violet-700">
                  Live
                </div>
                <p className="mt-2 text-sm text-slate-500">
                  Resume property actions and approval flow instantly.
                </p>
              </div>
            </div>
          </section>

          <section className="animate-fadeIn">
            <div className="surface-card-strong overflow-hidden">
              <div className="border-b border-slate-200 bg-gradient-to-r from-sky-50 to-cyan-50 px-6 py-6 md:px-8">
                <div className="page-kicker mb-3">
                  <span className="page-dot" />
                  Welcome back
                </div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                  Login to your account
                </h2>
                <p className="mt-2 text-sm text-slate-600">
                  Enter your credentials to access your workspace.
                </p>
              </div>

              <div className="px-6 py-6 md:px-8 md:py-8">
                {error ? (
                  <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                  </div>
                ) : null}

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Email address
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      placeholder="Enter your email"
                      className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3.5 text-slate-800 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                      required
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Password
                    </label>
                    <input
                      type="password"
                      name="password"
                      value={form.password}
                      onChange={handleChange}
                      placeholder="Enter your password"
                      className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3.5 text-slate-800 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="primary-btn w-full px-5 py-3.5 text-sm disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {submitting ? "Signing in..." : "Sign In"}
                  </button>
                </form>

                <div className="my-6 grid-divider" />

                <p className="text-sm text-slate-500">
                  Don&apos;t have an account?{" "}
                  <Link
                    href="/register"
                    className="font-semibold text-sky-700 hover:text-sky-800"
                  >
                    Create one now
                  </Link>
                </p>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}