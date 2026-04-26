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
      className={`px-3 py-1 rounded-full text-xs font-semibold ${
        enabled
          ? "bg-green-100 text-green-700"
          : "bg-slate-100 text-slate-500"
      }`}
    >
      {label}: {enabled ? "Yes" : "No"}
    </span>
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
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 py-10 space-y-6">
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-slate-100">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">My Profile</h1>
          <p className="text-slate-500 mb-8">
            App role controls dashboard access. On-chain permissions come from the Escrow contract roles attached to the connected wallet.
          </p>

          {message ? (
            <div className="mb-6 rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm text-indigo-700">
              {message}
            </div>
          ) : null}

          <div className="grid md:grid-cols-2 gap-6">
            <div className="rounded-2xl border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-800 mb-4">Account Details</h2>

              <div className="space-y-3 text-sm">
                <div>
                  <div className="text-slate-400">Name</div>
                  <div className="font-medium text-slate-700">{user.name}</div>
                </div>

                <div>
                  <div className="text-slate-400">Email</div>
                  <div className="font-medium text-slate-700">{user.email}</div>
                </div>

                <div>
                  <div className="text-slate-400">App Role</div>
                  <div className="font-medium text-slate-700">{user.role}</div>
                </div>

                <div>
                  <div className="text-slate-400">KYC Status</div>
                  <div className="font-medium text-slate-700">{user.kycStatus}</div>
                </div>

                <div>
                  <div className="text-slate-400">Linked Wallet</div>
                  <div className="font-medium text-slate-700 break-all">
                    {user.walletAddress || "No wallet linked yet"}
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-800 mb-4">Wallet & Contract Role Status</h2>

              <div className="space-y-4 text-sm">
                <div>
                  <div className="text-slate-400">Connected wallet</div>
                  <div className="font-medium text-slate-700 break-all">
                    {account || "No wallet connected"}
                  </div>
                </div>

                <div>
                  <div className="text-slate-400">Wallet link status</div>
                  <div className="font-medium text-slate-700">{walletStatus}</div>
                </div>

                <div>
                  <div className="text-slate-400 mb-2">On-chain role summary</div>
                  <div className="font-medium text-slate-700">
                    {connectedWalletRoleSummary}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <RolePill label="Inspector" enabled={contractRoleStatus.inspector} />
                  <RolePill label="Lender" enabled={contractRoleStatus.lender} />
                  <RolePill label="Government" enabled={contractRoleStatus.government} />
                </div>

                <button
                  onClick={connectWallet}
                  className="w-full rounded-xl bg-slate-800 text-white py-3 font-semibold hover:bg-slate-900 transition"
                >
                  {account ? "Reconnect / Switch Wallet" : "Connect MetaMask"}
                </button>

                <button
                  onClick={handleLinkWallet}
                  disabled={!account || linking}
                  className="w-full rounded-xl bg-indigo-600 text-white py-3 font-semibold hover:bg-indigo-700 disabled:bg-slate-300"
                >
                  {linking ? "Linking..." : "Link Current Wallet to Account"}
                </button>

                <button
                  onClick={refreshRoleStatus}
                  disabled={!account}
                  className="w-full rounded-xl border border-slate-300 text-slate-700 py-3 font-semibold hover:bg-slate-50 disabled:bg-slate-100 disabled:text-slate-400 transition"
                >
                  Refresh On-chain Role Status
                </button>

                <button
                  onClick={handleLogout}
                  className="w-full rounded-xl border border-red-300 text-red-600 py-3 font-semibold hover:bg-red-50 transition"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>

        {process.env.NODE_ENV !== "production" ? (
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-slate-100">
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Dev Role Switcher</h2>
            <p className="text-slate-500 mb-6">
              This only changes the app role and redirect target. It does not grant blockchain permissions by itself.
            </p>

            <div className="flex flex-wrap gap-3">
              {["user", "inspector", "government", "lender", "admin"].map((role) => (
                <button
                  key={role}
                  onClick={() => handleRoleSwitch(role)}
                  disabled={switchingRole === role}
                  className={`px-4 py-2 rounded-lg font-semibold border transition ${
                    user.role === role
                      ? "bg-indigo-600 text-white border-indigo-600"
                      : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  {switchingRole === role ? "Switching..." : role}
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </div>
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