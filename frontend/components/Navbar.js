// frontend/components/Navbar.js
import Link from "next/link";
import { useWeb3 } from "../context/Web3Context";
import { shortenAddress } from "../utils/helpers";
import { ROLES } from "../utils/constants";
import RoleBadge from "./RoleBadge";

export default function Navbar() {
  const { account, connectWallet, userRole } = useWeb3();

  return (
    <nav className="bg-white shadow-md px-4 md:px-8 py-4 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <span className="text-3xl">🏠</span>
          <span className="text-2xl font-bold text-indigo-600">
            BlockEstate
          </span>
        </Link>

        {/* Navigation Links */}
        <div className="hidden md:flex items-center gap-6">
          <Link
            href="/"
            className="text-slate-600 hover:text-indigo-600 font-medium transition"
          >
            Marketplace
          </Link>

          {account && (
            <>
              {userRole === "government" && (
                <Link
                  href="/dashboard/government"
                  className="text-slate-600 hover:text-red-600 font-medium transition"
                >
                  Gov Dashboard
                </Link>
              )}
              {userRole === "inspector" && (
                <Link
                  href="/dashboard/inspector"
                  className="text-slate-600 hover:text-orange-600 font-medium transition"
                >
                  Inspector Dashboard
                </Link>
              )}
              {userRole === "lender" && (
                <Link
                  href="/dashboard/lender"
                  className="text-slate-600 hover:text-blue-600 font-medium transition"
                >
                  Lender Dashboard
                </Link>
              )}
              {userRole === "user" && (
                <>
                  <Link
                    href="/dashboard/seller"
                    className="text-slate-600 hover:text-purple-600 font-medium transition"
                  >
                    Seller Dashboard
                  </Link>
                  <Link
                    href="/dashboard/buyer"
                    className="text-slate-600 hover:text-green-600 font-medium transition"
                  >
                    Buyer Dashboard
                  </Link>
                </>
              )}
            </>
          )}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {account && <RoleBadge role={userRole} />}

          <button
            onClick={connectWallet}
            className="bg-indigo-600 text-white px-5 py-2 rounded-lg font-semibold shadow hover:bg-indigo-700 transition"
          >
            {account ? shortenAddress(account) : "Connect Wallet"}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {account && (
        <div className="md:hidden flex flex-wrap gap-2 mt-3 pt-3 border-t border-slate-100">
          <Link
            href="/"
            className="text-xs bg-slate-100 px-3 py-1 rounded-full text-slate-600"
          >
            Marketplace
          </Link>
          {userRole === "government" && (
            <Link
              href="/dashboard/government"
              className="text-xs bg-red-50 px-3 py-1 rounded-full text-red-600"
            >
              Gov Dashboard
            </Link>
          )}
          {userRole === "inspector" && (
            <Link
              href="/dashboard/inspector"
              className="text-xs bg-orange-50 px-3 py-1 rounded-full text-orange-600"
            >
              Inspector
            </Link>
          )}
          {userRole === "lender" && (
            <Link
              href="/dashboard/lender"
              className="text-xs bg-blue-50 px-3 py-1 rounded-full text-blue-600"
            >
              Lender
            </Link>
          )}
          {userRole === "user" && (
            <>
              <Link
                href="/dashboard/seller"
                className="text-xs bg-purple-50 px-3 py-1 rounded-full text-purple-600"
              >
                Seller
              </Link>
              <Link
                href="/dashboard/buyer"
                className="text-xs bg-green-50 px-3 py-1 rounded-full text-green-600"
              >
                Buyer
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}