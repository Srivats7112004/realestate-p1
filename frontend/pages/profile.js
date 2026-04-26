import { useMemo, useState } from "react";
import { useRouter } from "next/router";
import Navbar from "../components/Navbar";
import AuthGuard from "../components/AuthGuard";
import { useAuth } from "../context/AuthContext";
import { useWeb3 } from "../context/Web3Context";

const getRouteForRole = (role) => {
  switch (role) {
    case "inspector":
      return "/dashboard/inspector";
    case "government":
      return "/dashboard/government";
    case "lender":
      return "/dashboard/lender";
    case "user":
    case "admin":
      return "/dashboard/seller";
    default:
      return "/profile";
  }
};

function RolePill({ label, enabled }) {
  return (
    <span
      className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
        enabled
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-slate-200 bg-slate-50 text-slate-500"
      }`}
    >
      {label}: {enabled ? "Yes" : "No"}
    </span>
  );
}

function InfoRow({ label, value, breakAll = false }) {
  return (
    <div className="flex flex-col gap-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
      <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
        {label}
      </div>
      <div className={`text-sm font-medium text-slate-800 ${breakAll ? "break-all" : ""}`}>
        {value}
      </div>
    </div>
  );
}

function ProfileContent() {
  const router = useRouter();
  const { user, logout, linkWallet, switchRole } = useAuth();
  const {
    account,
    connectWallet,
    linkedWallet,
    isLinkedWalletMatch,
    loadBlockchainData,
    refreshRoleStatus,
    contractRoleStatus,
  } = useWeb3();

  const [message, setMessage] = useState("");
  const [linking, setLinking] = useState(false);
  const [switchingRole, setSwitchingRole] = useState("");

  const walletStatus = useMemo(() => {
    if (!account) return "No wallet connected";
    if (!linkedWallet) return "Connected, but no wallet linked to profile yet";
    if (isLinkedWalletMatch) return "Connected wallet matches linked wallet";
    return "Connected wallet does not match your linked wallet";
  }, [account, linkedWallet, isLinkedWalletMatch]);

  const messageTone = useMemo(() => {
    if (!message) return "neutral";
    const lower = message.toLowerCase();

    if (
      lower.includes("failed") ||
      lower.includes("error") ||
      lower.includes("does not match")
    ) {
      return "error";
    }

    if (
      lower.includes("success") ||
      lower.includes("switched") ||
      lower.includes("linked")
    ) {
      return "success";
    }

    return "info";
  }, [message]);

  const handleLinkWallet = async () => {
    if (!account) {
      setMessage("Please connect MetaMask first.");
      return;
    }

    try {
      setLinking(true);
      setMessage("");
      await linkWallet(account);
      await loadBlockchainData(false);
      await refreshRoleStatus();
      setMessage("Wallet linked successfully.");
    } catch (error) {
      setMessage(error.message || "Wallet linking failed.");
    } finally {
      setLinking(false);
    }
  };

  const handleRoleSwitch = async (role) => {
    try {
      setSwitchingRole(role);
      setMessage("");
      await switchRole(role);
      await loadBlockchainData(false);
      await refreshRoleStatus();
      setMessage(
        `Role switched to ${role}. Dashboard access changed. On-chain permissions still depend on whether the connected wallet has that role in the Escrow contract.`
      );
      router.push(getRouteForRole(role));
    } catch (error) {
      setMessage(error.message || "Role switch failed.");
    } finally {
      setSwitchingRole("");
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.push("/login");
    } catch (error) {
      setMessage(error.message || "Logout failed.");
    }
  };

  const connectedWalletRoleSummary = useMemo(() => {
    const roles = [];
    if (contractRoleStatus.inspector) roles.push("Inspector");
    if (contractRoleStatus.lender) roles.push("Lender");
    if (contractRoleStatus.government) roles.push("Government");

    if (roles.length === 0) return "No special on-chain roles";
    return roles.join(", ");
  }, [contractRoleStatus]);

  return (
    <div className="app-shell min-h-screen">
      <Navbar />

      <main className="app-container py-8 md:py-10">
        {/* Hero */}
        <section className="animate-fadeIn">
          <div className="hero-panel overflow-hidden px-6 py-8 md:px-10 md:py-10">
            <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
              <div>
                <div className="page-kicker mb-5">
                  <span className="page-dot" />
                  Profile and wallet control center
                </div>

                <h1 className="mb-4 text-4xl font-bold tracking-tight text-slate-900 md:text-5xl">
                  Manage your account, wallet linkage, and role access
                </h1>

                <p className="section-subtext max-w-2xl text-base md:text-lg">
                  Your app role controls dashboard access, while your connected wallet
                  determines on-chain permissions inside the escrow workflow.
                </p>

                <div className="mt-7 flex flex-wrap gap-3">
                  <div className="ghost-chip px-4 py-2 text-sm font-medium">
                    App role: {user.role}
                  </div>
                  <div className="ghost-chip px-4 py-2 text-sm font-medium">
                    KYC: {user.kycStatus}
                  </div>
                  <div className="ghost-chip px-4 py-2 text-sm font-medium">
                    Wallet: {account ? "Connected" : "Not connected"}
                  </div>
                </div>
              </div>

              <div className="surface-card-strong p-5 md:p-6">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold text-slate-800">
                      Quick Profile Snapshot
                    </div>
                    <div className="text-xs text-slate-500">
                      Current account and wallet status
                    </div>
                  </div>

                  <div className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
                    Live
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <div className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-400">
                      Profile Name
                    </div>
                    <div className="text-lg font-bold text-slate-900">
                      {user.name}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <div className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-400">
                      Active Role
                    </div>
                    <div className="text-lg font-bold text-sky-700">
                      {user.role}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <div className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-400">
                      Wallet Link Status
                    </div>
                    <div className="text-sm font-semibold text-slate-800">
                      {walletStatus}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {message ? (
          <section className="pt-6 animate-fadeIn">
            <div
              className={`rounded-2xl border px-4 py-4 text-sm font-medium ${
                messageTone === "error"
                  ? "border-red-200 bg-red-50 text-red-700"
                  : messageTone === "success"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-sky-200 bg-sky-50 text-sky-700"
              }`}
            >
              {message}
            </div>
          </section>
        ) : null}

        {/* Main cards */}
        <section className="pt-8">
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="surface-card-strong p-6 md:p-8">
              <div className="mb-6">
                <div className="page-kicker mb-3">
                  <span className="page-dot" />
                  Account details
                </div>
                <h2 className="section-heading">User profile information</h2>
                <p className="section-subtext mt-2">
                  This section shows your app-level identity and the profile data used across the platform.
                </p>
              </div>

              <div className="grid gap-4">
                <InfoRow label="Name" value={user.name} />
                <InfoRow label="Email" value={user.email} />
                <InfoRow label="App Role" value={user.role} />
                <InfoRow label="KYC Status" value={user.kycStatus} />
                <InfoRow
                  label="Linked Wallet"
                  value={user.walletAddress || "No wallet linked yet"}
                  breakAll
                />
              </div>
            </div>

            <div className="surface-card-strong p-6 md:p-8">
              <div className="mb-6">
                <div className="page-kicker mb-3">
                  <span className="page-dot" />
                  Wallet and contract state
                </div>
                <h2 className="section-heading">Connected wallet status</h2>
                <p className="section-subtext mt-2">
                  Compare your connected wallet, linked wallet, and live on-chain role permissions.
                </p>
              </div>

              <div className="grid gap-4">
                <InfoRow
                  label="Connected Wallet"
                  value={account || "No wallet connected"}
                  breakAll
                />
                <InfoRow label="Wallet Link Status" value={walletStatus} />
                <InfoRow label="On-chain Role Summary" value={connectedWalletRoleSummary} />

                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                  <div className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                    Escrow Contract Roles
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <RolePill label="Inspector" enabled={contractRoleStatus.inspector} />
                    <RolePill label="Lender" enabled={contractRoleStatus.lender} />
                    <RolePill label="Government" enabled={contractRoleStatus.government} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Action center */}
        <section className="pt-8">
          <div className="surface-card-strong p-6 md:p-8">
            <div className="mb-6">
              <div className="page-kicker mb-3">
                <span className="page-dot" />
                Action center
              </div>
              <h2 className="section-heading">Manage wallet linkage and session</h2>
              <p className="section-subtext mt-2 max-w-2xl">
                Connect or switch MetaMask, link the current wallet to your profile,
                refresh on-chain role detection, or securely log out.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <button
                onClick={connectWallet}
                className="primary-btn px-5 py-4 text-sm"
              >
                {account ? "Reconnect / Switch Wallet" : "Connect MetaMask"}
              </button>

              <button
                onClick={handleLinkWallet}
                disabled={!account || linking}
                className="rounded-2xl border border-sky-200 bg-sky-50 px-5 py-4 text-sm font-semibold text-sky-700 transition hover:bg-sky-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {linking ? "Linking..." : "Link Current Wallet"}
              </button>

              <button
                onClick={refreshRoleStatus}
                disabled={!account}
                className="rounded-2xl border border-slate-300 bg-white px-5 py-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Refresh On-chain Roles
              </button>

              <button
                onClick={handleLogout}
                className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-semibold text-red-600 transition hover:bg-red-100"
              >
                Logout
              </button>
            </div>
          </div>
        </section>

        {/* Dev role switcher */}
        {process.env.NODE_ENV !== "production" ? (
          <section className="pt-8">
            <div className="surface-card-strong p-6 md:p-8">
              <div className="mb-6">
                <div className="page-kicker mb-3">
                  <span className="page-dot" />
                  Development tools
                </div>
                <h2 className="section-heading">Dev role switcher</h2>
                <p className="section-subtext mt-2 max-w-2xl">
                  This changes the app role and dashboard routing only. It does not automatically grant blockchain permissions inside the escrow contract.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                {["user", "inspector", "government", "lender", "admin"].map((role) => {
                  const active = user.role === role;
                  const loading = switchingRole === role;

                  return (
                    <button
                      key={role}
                      onClick={() => handleRoleSwitch(role)}
                      disabled={loading}
                      className={`rounded-full px-5 py-2.5 text-sm font-semibold transition ${
                        active
                          ? "bg-sky-600 text-white shadow-sm"
                          : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                      } ${loading ? "opacity-60" : ""}`}
                    >
                      {loading ? "Switching..." : role}
                    </button>
                  );
                })}
              </div>
            </div>
          </section>
        ) : null}
      </main>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <AuthGuard>
      <ProfileContent />
    </AuthGuard>
  );
}