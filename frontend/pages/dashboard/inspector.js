import { useState } from "react";
import { useWeb3 } from "../../context/Web3Context";
import Navbar from "../../components/Navbar";
import PropertyCard from "../../components/PropertyCard";
import AIInspectionPanel from "../../components/AIInspectionPanel";
import AuthGuard from "../../components/AuthGuard";

function InspectorDashboardInner() {
  const {
    provider,
    escrow,
    properties,
    loadBlockchainData,
    runAIInspection,
    canUseRoleWallet,
    requiredRoleWallet,
  } = useWeb3();

  const [aiReports, setAiReports] = useState({});
  const [aiErrors, setAiErrors] = useState({});
  const [activeAIPropertyId, setActiveAIPropertyId] = useState(null);

  const pending = properties.filter((p) => !p.inspectionPassed && !p.sold);
  const passed = properties.filter((p) => p.inspectionPassed || p.sold);

  const handleAction = async (action, property) => {
    try {
      if (!provider || !escrow) {
        alert("Wallet or contract not ready.");
        return;
      }

      if (action === "inspect") {
        if (!canUseRoleWallet) {
          alert(
            requiredRoleWallet
              ? `Your app role is inspector, but the current smart contract still requires the configured inspector wallet:\n${requiredRoleWallet}`
              : "You cannot perform this action with the currently connected wallet."
          );
          return;
        }

        const signer = provider.getSigner();
        const tx = await escrow.connect(signer).updateInspectionStatus(property.id, true);
        await tx.wait();

        alert("Inspection approved!");
        await loadBlockchainData();
      }
    } catch (error) {
      console.error("Inspection failed:", error);
      alert(error?.reason || error?.message || "Inspection failed.");
    }
  };

  const handleAIRun = async (property) => {
    try {
      setActiveAIPropertyId(property.id);
      setAiErrors((prev) => ({ ...prev, [property.id]: "" }));

      const report = await runAIInspection(property);

      setAiReports((prev) => ({
        ...prev,
        [property.id]: report,
      }));
    } catch (error) {
      setAiErrors((prev) => ({
        ...prev,
        [property.id]: error.message || "AI inspection failed.",
      }));
    } finally {
      setActiveAIPropertyId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        <h1 className="text-3xl font-bold text-slate-800 mb-2">🔍 Inspector Dashboard</h1>
        <p className="text-slate-500 mb-8">
          Review listings, run AI-assisted checks, and approve inspection on-chain.
        </p>

        {!canUseRoleWallet ? (
          <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-800">
            You can access this dashboard because your <strong>app role</strong> is inspector.
            But the current smart contract still requires the configured inspector wallet for the
            final on-chain inspection transaction.
            {requiredRoleWallet ? (
              <>
                <br />
                <span className="font-semibold">Required inspector wallet:</span> {requiredRoleWallet}
              </>
            ) : null}
          </div>
        ) : (
          <div className="mb-6 rounded-xl border border-green-200 bg-green-50 px-4 py-4 text-sm text-green-800">
            Connected wallet is valid for inspector on-chain actions.
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow p-6">
            <div className="text-sm text-slate-500">Total Properties</div>
            <div className="text-3xl font-bold text-slate-700">{properties.length}</div>
          </div>

          <div className="bg-white rounded-xl shadow p-6">
            <div className="text-sm text-slate-500">Pending Inspection</div>
            <div className="text-3xl font-bold text-orange-600">{pending.length}</div>
          </div>

          <div className="bg-white rounded-xl shadow p-6">
            <div className="text-sm text-slate-500">Inspection Passed</div>
            <div className="text-3xl font-bold text-green-600">{passed.length}</div>
          </div>
        </div>

        <h2 className="text-xl font-bold text-slate-700 mb-4">
          ⏳ Pending Inspection ({pending.length})
        </h2>

        {pending.length > 0 ? (
          <div className="grid gap-6">
            {pending.map((property) => (
              <div
                key={property.id}
                className="grid xl:grid-cols-[420px,1fr] gap-6 items-start"
              >
                <PropertyCard property={property} onAction={handleAction} />
                <AIInspectionPanel
                  property={property}
                  report={aiReports[property.id]}
                  error={aiErrors[property.id]}
                  loading={activeAIPropertyId === property.id}
                  onRun={handleAIRun}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 bg-white rounded-2xl shadow mb-10">
            <p className="text-green-600 font-semibold">✅ All inspections complete!</p>
          </div>
        )}

        <h2 className="text-xl font-bold text-slate-700 mt-10 mb-4">
          ✅ Passed ({passed.length})
        </h2>

        {passed.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {passed.map((property) => (
              <PropertyCard key={property.id} property={property} onAction={handleAction} />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 bg-white rounded-2xl shadow">
            <p className="text-slate-500">No inspected properties yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function InspectorDashboardPage() {
  return (
    <AuthGuard allowedRoles={["inspector"]}>
      <InspectorDashboardInner />
    </AuthGuard>
  );
}