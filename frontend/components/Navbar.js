import Link from "next/link";
import { useRouter } from "next/router";
import { useWeb3 } from "../context/Web3Context";
import { useAuth } from "../context/AuthContext";
import { shortenAddress } from "../utils/helpers";
import RoleBadge from "./RoleBadge";

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

  return (
    <nav className="bg-white shadow-md px-4 md:px-8 py-4 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex justify-between items-center gap-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-3xl">🏠</span>
          <span className="text-2xl font-bold text-indigo-600">BlockEstate</span>
        </Link>

        <div className="hidden md:flex items-center gap-5">
          <Link
            href="/"
            className="text-slate-600 hover:text-indigo-600 font-medium transition"
          >
            Marketplace
          </Link>

          {user ? (
            <>
              {isNormalUser ? (
                <>
                  <Link
                    href="/dashboard/seller"
                    className="text-slate-600 hover:text-purple-600 font-medium transition"
                  >
                    Seller Dashboard
                  </Link>
                  <Link
                    href="/dashboard/buyer"
                    className="text-slate-600 hover:text-indigo-600 font-medium transition"
                  >
                    Buyer Dashboard
                  </Link>
                </>
              ) : null}

              {role === "inspector" ? (
                <Link
                  href="/dashboard/inspector"
                  className="text-slate-600 hover:text-orange-600 font-medium transition"
                >
                  Inspector Dashboard
                </Link>
              ) : null}

              {role === "government" ? (
                <Link
                  href="/dashboard/government"
                  className="text-slate-600 hover:text-red-600 font-medium transition"
                >
                  Government Dashboard
                </Link>
              ) : null}

              {role === "lender" ? (
                <Link
                  href="/dashboard/lender"
                  className="text-slate-600 hover:text-blue-600 font-medium transition"
                >
                  Lender Dashboard
                </Link>
              ) : null}

              <Link
                href="/profile"
                className="text-slate-600 hover:text-indigo-600 font-medium transition"
              >
                Profile
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-slate-600 hover:text-indigo-600 font-medium transition"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="text-slate-600 hover:text-indigo-600 font-medium transition"
              >
                Register
              </Link>
            </>
          )}
        </div>

        <div className="flex items-center gap-3 flex-wrap justify-end">
          {user ? (
            <>
              <span className="text-sm text-slate-600 font-medium">
                Hi, {user.name}
              </span>
              <RoleBadge role={user.role} />
            </>
          ) : null}

          <button
            onClick={connectWallet}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-semibold shadow hover:bg-indigo-700 transition"
          >
            {account ? shortenAddress(account) : "Connect Wallet"}
          </button>

          {user ? (
            <button
              onClick={handleLogout}
              className="border border-slate-300 text-slate-700 px-4 py-2 rounded-lg font-semibold hover:bg-slate-50 transition"
            >
              Logout
            </button>
          ) : null}
        </div>
      </div>
    </nav>
  );
}