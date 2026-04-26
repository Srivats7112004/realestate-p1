import { useWeb3 } from "../../context/Web3Context";
import Navbar from "../../components/Navbar";
import PropertyCard from "../../components/PropertyCard";
import AuthGuard from "../../components/AuthGuard";

function LenderDashboardInner() {
  const {
    provider,
    escrow,
    properties,
    loadBlockchainData,
    canUseRoleWallet,
    contractRoleStatus,
  } = useWeb3();

  const pending = properties.filter(
    (p) => p.buyerDeposited && !p.lenderApproved && !p.sold
  );
  const approved = properties.filter((p) => p.lenderApproved || p.sold);

  const handleAction = async (action, property) => {
    try {
      if (action !== "lend") return;

      if (!provider || !escrow) {
        alert("Wallet or contract not ready.");
        return;
      }

      if (!canUseRoleWallet || !contractRoleStatus.lender) {
        alert(
          "The connected wallet does not currently have LENDER role on-chain. Grant the role in the Escrow contract or connect a wallet that already has it."
        );
        return;
      }

      if (!property.buyerDeposited) {
        alert("Buyer has not funded escrow yet.");
        return;
      }

      const signer = provider.getSigner();
      const tx = await escrow.connect(signer).approveSale(property.id);
      await tx.wait();

      alert("Loan approved!");
      await loadBlockchainData(false);
    } catch (error) {
      console.error("Lender approval failed:", error);
      alert(error?.reason || error?.message || "Lender approval failed.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        <h1 className="text-3xl font-bold text-slate-800 mb-2">🏦 Lender Dashboard</h1>
        <p className="text-slate-500 mb-8">
          Review escrow-funded deals and record lender approval on-chain.
        </p>

        {contractRoleStatus.lender ? (
          <div className="mb-6 rounded-xl border border-green-200 bg-green-50 px-4 py-4 text-sm text-green-800">
            Connected wallet has <strong>LENDER</strong> role on-chain.
          </div>
        ) : (
          <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-800">
            Your app role is lender, but the connected wallet does <strong>not</strong> currently
            have lender role on-chain. Grant the role in the contract or connect a wallet that has it.
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow p-6">
            <div className="text-sm text-slate-500">Total Properties</div>
            <div className="text-3xl font-bold text-slate-700">{properties.length}</div>
          </div>

          <div className="bg-white rounded-xl shadow p-6">
            <div className="text-sm text-slate-500">Pending Loan Approval</div>
            <div className="text-3xl font-bold text-orange-600">{pending.length}</div>
          </div>

          <div className="bg-white rounded-xl shadow p-6">
            <div className="text-sm text-slate-500">Approved</div>
            <div className="text-3xl font-bold text-green-600">{approved.length}</div>
          </div>
        </div>

        <h2 className="text-xl font-bold text-slate-700 mb-4">
          ⏳ Pending Loan Approval ({pending.length})
        </h2>

        {pending.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 mb-10">
            {pending.map((property) => (
              <PropertyCard
                key={property.id}
                property={property}
                onAction={handleAction}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 bg-white rounded-2xl shadow mb-10">
            <p className="text-green-600 font-semibold">✅ No pending loan approvals.</p>
          </div>
        )}

        <h2 className="text-xl font-bold text-slate-700 mb-4">
          ✅ Approved Properties ({approved.length})
        </h2>

        {approved.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {approved.map((property) => (
              <PropertyCard
                key={property.id}
                property={property}
                onAction={handleAction}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 bg-white rounded-2xl shadow">
            <p className="text-slate-500">No lender-approved properties yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function LenderDashboardPage() {
  return (
    <AuthGuard allowedRoles={["lender"]}>
      <LenderDashboardInner />
    </AuthGuard>
  );
}