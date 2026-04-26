import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";

export default function RegisterPage() {
  const router = useRouter();
  const { user, register } = useAuth();

  const [form, setForm] = useState({
    name: "",
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
      await register(form);
      router.push("/profile");
    } catch (err) {
      setError(err.message || "Registration failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="app-shell min-h-screen">
      <Navbar />

      <main className="app-container py-10 md:py-14">
        <div className="grid items-center gap-8 lg:grid-cols-[1.02fr_0.98fr]">
          <section className="animate-fadeIn">
            <div className="page-kicker mb-5">
              <span className="page-dot" />
              Create your workspace
            </div>

            <h1 className="mb-4 max-w-2xl text-4xl font-bold tracking-tight text-slate-900 md:text-5xl">
              Set up your BlockEstate account in a cleaner, professional flow
            </h1>

            <p className="section-subtext max-w-xl text-base md:text-lg">
              Create your profile to manage listings, connect wallets, and access
              the right dashboard experience for property and approval workflows.
            </p>

            <div className="mt-8 space-y-4">
              {[
                {
                  title: "Create your identity",
                  desc: "Set up a clean user profile for dashboard access and property actions.",
                },
                {
                  title: "Connect your wallet",
                  desc: "Link the correct wallet after signup for blockchain interactions.",
                },
                {
                  title: "Start transacting",
                  desc: "List, review, approve, or purchase properties depending on your role.",
                },
              ].map((item, index) => (
                <div
                  key={item.title}
                  className="surface-card flex gap-4 px-5 py-4"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-sky-50 text-sm font-bold text-sky-700">
                    0{index + 1}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">
                      {item.title}
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="animate-fadeIn">
            <div className="surface-card-strong overflow-hidden">
              <div className="border-b border-slate-200 bg-gradient-to-r from-sky-50 to-cyan-50 px-6 py-6 md:px-8">
                <div className="page-kicker mb-3">
                  <span className="page-dot" />
                  New account
                </div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                  Create your account
                </h2>
                <p className="mt-2 text-sm text-slate-600">
                  Join the platform and get your profile ready for wallet-linked transactions.
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
                      Full name
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      placeholder="Enter your full name"
                      className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3.5 text-slate-800 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                      required
                    />
                  </div>

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
                      placeholder="Create a password"
                      className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3.5 text-slate-800 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="primary-btn w-full px-5 py-3.5 text-sm disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {submitting ? "Creating account..." : "Create Account"}
                  </button>
                </form>

                <div className="my-6 grid-divider" />

                <p className="text-sm text-slate-500">
                  Already have an account?{" "}
                  <Link
                    href="/login"
                    className="font-semibold text-sky-700 hover:text-sky-800"
                  >
                    Sign in here
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