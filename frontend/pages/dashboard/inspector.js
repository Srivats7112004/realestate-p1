// frontend/pages/dashboard/inspector.js
import { useWeb3 } from "../../context/Web3Context";
import Navbar from "../../components/Navbar";
import PropertyCard from "../../components/PropertyCard";

export default function InspectorDashboard() {
  const { provider, escrow, properties, loadBlockchainData } = useWeb3();

  const pending = properties.filter((p) => !p.inspectionPassed);
  const passed = properties.filter((p) => p.inspectionPassed);

  const handleAction = async (action, property) => {
    try {
      const signer = provider.getSigner();
      if (action === "inspect") {
        const tx = await escrow
          .connect(signer)
          .updateInspectionStatus(property.id, true);
        await tx.wait();
        alert("Inspection approved!");
        loadBlockchainData();
      }
    } catch (error) {
      console.error("Inspection failed:", error);
      alert(error?.reason || error?.message || "Inspection failed.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        <h1 className="text-3xl font-bold text-slate-800 mb-2">
          🔍 Inspector Dashboard
        </h1>
        <p className="text-slate-500 mb-8">
          Review and approve property inspections
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow p-6">
            <div className="text-sm text-slate-500">Total Properties</div>
            <div className="text-3xl font-bold text-slate-700">
              {properties.length}
            </div>
          </div>
          <div className="bg-white rounded-xl shadow p-6">
            <div className="text-sm text-slate-500">Pending Inspection</div>
            <div className="text-3xl font-bold text-orange-600">
              {pending.length}
            </div>
          </div>
          <div className="bg-white rounded-xl shadow p-6">
            <div className="text-sm text-slate-500">Inspection Passed</div>
            <div className="text-3xl font-bold text-green-600">
              {passed.length}
            </div>
          </div>
        </div>

        <h2 className="text-xl font-bold text-slate-700 mb-4">
          ⏳ Pending Inspection ({pending.length})
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
            <p className="text-green-600 font-semibold">
              ✅ All inspections complete!
            </p>
          </div>
        )}

        <h2 className="text-xl font-bold text-slate-700 mb-4">
          ✅ Passed ({passed.length})
        </h2>
        {passed.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {passed.map((property) => (
              <PropertyCard
                key={property.id}
                property={property}
                onAction={handleAction}
              />
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