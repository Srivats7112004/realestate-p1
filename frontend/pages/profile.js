import { useMemo, useState } from "react";
import Navbar from "../components/Navbar";
import AuthGuard from "../components/AuthGuard";
import { useAuth } from "../context/AuthContext";
import { useWeb3 } from "../context/Web3Context";

function ProfileContent() {
  const { user, logout, linkWallet, switchRole } = useAuth();
  const {
    account,
    connectWallet,
    linkedWallet,
    isLinkedWalletMatch,
    requiredRoleWallet,
    isSpecialRoleWalletMatch,
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
      setMessage(`Role switched to ${role}.`);
    } catch (error) {
      setMessage(error.message || "Role switch failed.");
    } finally {
      setSwitchingRole("");
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      window.location.href = "/login";
    } catch (error) {
      setMessage(error.message || "Logout failed.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 py-10 space-y-6">
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-slate-100">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">My Profile</h1>
          <p className="text-slate-500 mb-8">
            App role now controls dashboards and permissions. Wallet is only for signing transactions.
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
              <h2 className="text-lg font-semibold text-slate-800 mb-4">Wallet Status</h2>

              <div className="space-y-4 text-sm">
                <div>
                  <div className="text-slate-400">Connected wallet</div>
                  <div className="font-medium text-slate-700 break-all">
                    {account || "No wallet connected"}
                  </div>
                </div>

                <div>
                  <div className="text-slate-400">Status</div>
                  <div className="font-medium text-slate-700">{walletStatus}</div>
                </div>

                {requiredRoleWallet ? (
                  <div>
                    <div className="text-slate-400">Required on-chain role wallet</div>
                    <div className="font-medium text-slate-700 break-all">
                      {requiredRoleWallet}
                    </div>
                    <div className={`mt-1 text-sm ${isSpecialRoleWalletMatch ? "text-green-600" : "text-amber-600"}`}>
                      {isSpecialRoleWalletMatch
                        ? "Connected wallet matches the contract role wallet."
                        : "Your app role is correct, but the contract will still require the configured role wallet for special on-chain actions."}
                    </div>
                  </div>
                ) : null}

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
              Use this only for local testing. This changes app role access without changing MetaMask account.
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