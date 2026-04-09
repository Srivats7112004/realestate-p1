import { useWeb3 } from "../../context/Web3Context";
import Navbar from "../../components/Navbar";
import PropertyCard from "../../components/PropertyCard";
import AuthGuard from "../../components/AuthGuard";

function GovernmentDashboardInner() {
  const {
    provider,
    escrow,
    properties,
    loadBlockchainData,
    kycStatus,
    approveKYC,
    rejectKYC,
    canUseRoleWallet,
    requiredRoleWallet,
  } = useWeb3();

  const unverified = properties.filter((p) => !p.governmentVerified);
  const verified = properties.filter((p) => p.governmentVerified);

  const pendingKYC = Object.entries(kycStatus || {})
    .filter(([_, status]) => status === "pending")
    .map(([address]) => address);

  const handleAction = async (action, property) => {
    try {
      if (!provider || !escrow) {
        alert("Wallet or contract not ready.");
        return;
      }

      if (action === "verify") {
        if (!canUseRoleWallet) {
          alert(
            requiredRoleWallet
              ? `Your app role is government, but the current smart contract still requires the configured government wallet:\n${requiredRoleWallet}`
              : "You cannot perform this action with the currently connected wallet."
          );
          return;
        }

        const signer = provider.getSigner();
        const tx = await escrow.connect(signer).verifyProperty(property.id);
        await tx.wait();

        alert("Property verified!");
        await loadBlockchainData();
      }
    } catch (error) {
      console.error("Verification failed:", error);
      alert(error?.reason || error?.message || "Verification failed.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        <h1 className="text-3xl font-bold text-slate-800 mb-2">
          🏛 Government Dashboard
        </h1>
        <p className="text-slate-500 mb-8">
          Verify property ownership and manage KYC approvals.
        </p>

        {!canUseRoleWallet ? (
          <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-800">
            You can access this dashboard because your <strong>app role</strong> is government.
            But the current smart contract still requires the configured government wallet for the
            final on-chain verification transaction.
            {requiredRoleWallet ? (
              <>
                <br />
                <span className="font-semibold">Required government wallet:</span> {requiredRoleWallet}
              </>
            ) : null}
          </div>
        ) : (
          <div className="mb-6 rounded-xl border border-green-200 bg-green-50 px-4 py-4 text-sm text-green-800">
            Connected wallet is valid for government on-chain actions.
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow p-6">
            <div className="text-sm text-slate-500">Total Properties</div>
            <div className="text-3xl font-bold text-slate-700">{properties.length}</div>
          </div>

          <div className="bg-white rounded-xl shadow p-6">
            <div className="text-sm text-slate-500">Pending Verification</div>
            <div className="text-3xl font-bold text-orange-600">{unverified.length}</div>
          </div>

          <div className="bg-white rounded-xl shadow p-6">
            <div className="text-sm text-slate-500">Verified</div>
            <div className="text-3xl font-bold text-green-600">{verified.length}</div>
          </div>

          <div className="bg-white rounded-xl shadow p-6">
            <div className="text-sm text-slate-500">Pending KYC</div>
            <div className="text-3xl font-bold text-yellow-600">{pendingKYC.length}</div>
          </div>
        </div>

        {pendingKYC.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
            <h2 className="text-xl font-bold text-slate-700 mb-4">
              📋 Pending KYC Requests
            </h2>

            <div className="space-y-3">
              {pendingKYC.map((address) => (
                <div
                  key={address}
                  className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg border border-yellow-200"
                >
                  <div>
                    <span className="font-mono text-sm text-slate-700">{address}</span>
                    <span className="ml-2 text-xs bg-yellow-200 text-yellow-800 px-2 py-0.5 rounded-full">
                      Pending
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => approveKYC(address)}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-green-700"
                    >
                      ✅ Approve
                    </button>
                    <button
                      onClick={() => rejectKYC(address)}
                      className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-700"
                    >
                      ❌ Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <h2 className="text-xl font-bold text-slate-700 mb-4">
          ⏳ Properties Awaiting Verification ({unverified.length})
        </h2>

        {unverified.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 mb-10">
            {unverified.map((property) => (
              <PropertyCard
                key={property.id}
                property={property}
                onAction={handleAction}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 bg-white rounded-2xl shadow mb-10">
            <p className="text-green-600 font-semibold">✅ All properties are verified!</p>
          </div>
        )}

        <h2 className="text-xl font-bold text-slate-700 mb-4">
          ✅ Verified Properties ({verified.length})
        </h2>

        {verified.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {verified.map((property) => (
              <PropertyCard
                key={property.id}
                property={property}
                onAction={handleAction}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 bg-white rounded-2xl shadow">
            <p className="text-slate-500">No verified properties yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function GovernmentDashboardPage() {
  return (
    <AuthGuard allowedRoles={["government"]}>
      <GovernmentDashboardInner />
    </AuthGuard>
  );
}