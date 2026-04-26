import Link from "next/link";
import { useRouter } from "next/router";
import { useWeb3 } from "../context/Web3Context";
import { useAuth } from "../context/AuthContext";
import { shortenAddress } from "../utils/helpers";
import RoleBadge from "./RoleBadge";

const navItemClass = (active) =>
  `text-sm font-medium transition-colors ${
    active ? "text-sky-700" : "text-slate-600 hover:text-slate-900"
  }`;

export default function Navbar() {
  const router = useRouter();
  const { account, connectWallet } = useWeb3();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      router.push("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const role = user?.role || "guest";
  const isNormalUser = role === "user" || role === "admin";

  const links = [
    { href: "/", label: "Marketplace", show: true },
    { href: "/marketplace", label: "Browse", show: true },
    { href: "/dashboard/seller", label: "Seller", show: Boolean(user && isNormalUser) },
    { href: "/dashboard/buyer", label: "Buyer", show: Boolean(user && isNormalUser) },
    { href: "/dashboard/inspector", label: "Inspector", show: role === "inspector" },
    { href: "/dashboard/government", label: "Government", show: role === "government" },
    { href: "/dashboard/lender", label: "Lender", show: role === "lender" },
    { href: "/profile", label: "Profile", show: Boolean(user) },
    { href: "/login", label: "Login", show: !user },
    { href: "/register", label: "Register", show: !user },
  ];

  return (
    <nav className="sticky top-0 z-50 border-b border-slate-200 bg-white/88 backdrop-blur-xl supports-[backdrop-filter]:bg-white/80">
      <div className="app-container">
        <div className="flex flex-wrap items-center justify-between gap-4 py-4">
          <Link href="/landing" className="flex items-center gap-3 transition-transform duration-200 hover:scale-[1.01]">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-600 text-white shadow-sm">
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0h6"
                />
              </svg>
            </div>

            <div>
              <div className="text-lg font-semibold tracking-tight text-slate-900">
                BlockEstate
              </div>
              <div className="text-xs text-slate-500">
                Secure onchain real-estate workflow
              </div>
            </div>
          </Link>

          <div className="hidden items-center gap-6 md:flex">
            {links
              .filter((item) => item.show)
              .map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={navItemClass(router.pathname === item.href)}
                >
                  {item.label}
                </Link>
              ))}
          </div>

          <div className="flex flex-wrap items-center justify-end gap-3">
            {user ? (
              <div className="hidden rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 md:flex md:items-center md:gap-3">
                <div className="text-right">
                  <div className="text-sm font-semibold text-slate-800">
                    {user.name}
                  </div>
                  <div className="text-xs text-slate-500">
                    Signed in
                  </div>
                </div>
                <RoleBadge role={user.role} />
              </div>
            ) : null}

            <button
              onClick={connectWallet}
              className="rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-sky-700 hover:shadow-md"
            >
              {account ? shortenAddress(account) : "Connect Wallet"}
            </button>

            {user ? (
              <button
                onClick={handleLogout}
                className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Logout
              </button>
            ) : null}
          </div>
        </div>

        <div className="flex gap-3 overflow-x-auto pb-4 md:hidden">
          {links
            .filter((item) => item.show)
            .map((item) => {
              const active = router.pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium transition ${
                    active
                      ? "border-sky-200 bg-sky-50 text-sky-700"
                      : "border-slate-200 bg-white text-slate-600"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
        </div>
      </div>
    </nav>
  );
}