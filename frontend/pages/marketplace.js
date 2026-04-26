import { useMemo, useState } from "react";
import Navbar from "../components/Navbar";
import PropertyCard from "../components/PropertyCard";
import { useWeb3 } from "../context/Web3Context";

export default function Marketplace() {
  const { provider, escrow, properties, loading, loadBlockchainData } = useWeb3();
  const [filter, setFilter] = useState("all");

  const handleAction = async (action, property) => {
    try {
      if (!provider || !escrow) {
        alert("Wallet or contract not ready.");
        return;
      }

      const signer = provider.getSigner();

      switch (action) {
        case "buy": {
          const tx = await escrow.connect(signer).depositEarnest(property.id, {
            value: property.purchasePrice,
          });
          await tx.wait();
          alert("Payment deposited successfully!");
          break;
        }
        case "inspect": {
          const tx = await escrow.connect(signer).updateInspectionStatus(property.id, true);
          await tx.wait();
          alert("Inspection approved!");
          break;
        }
        case "lend": {
          const tx = await escrow.connect(signer).approveSale(property.id);
          await tx.wait();
          alert("Loan approved!");
          break;
        }
        case "verify": {
          const tx = await escrow.connect(signer).verifyProperty(property.id);
          await tx.wait();
          alert("Property verified!");
          break;
        }
        case "sell": {
          let tx = await escrow.connect(signer).approveSale(property.id);
          await tx.wait();

          tx = await escrow.connect(signer).finalizeSale(property.id);
          await tx.wait();

          alert("Sale completed!");
          break;
        }
        default:
          break;
      }

      await loadBlockchainData(false);
    } catch (error) {
      console.error(`${action} failed:`, error);
      alert(error?.reason || error?.message || `${action} failed.`);
    }
  };

  const filteredProperties = useMemo(() => {
    return properties.filter((property) => {
      if (filter === "verified") return property.governmentVerified;
      if (filter === "pending") return !property.governmentVerified;
      return true;
    });
  }, [properties, filter]);

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            🏠 Property Marketplace
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Browse verified properties and track each stage of the blockchain escrow flow.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-4 mb-8">
          {[
            { key: "all", label: "📋 All Properties" },
            { key: "verified", label: "✅ Verified Only" },
            { key: "pending", label: "⏳ Pending Verification" },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-6 py-2 rounded-full font-medium transition ${
                filter === key
                  ? "bg-indigo-600 text-white"
                  : "bg-white text-gray-600 hover:bg-gray-100"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-4 mb-8 max-w-md mx-auto">
          <div className="bg-white rounded-xl p-4 text-center shadow">
            <p className="text-2xl font-bold text-gray-800">{properties.length}</p>
            <p className="text-sm text-gray-500">Total</p>
          </div>
          <div className="bg-white rounded-xl p-4 text-center shadow">
            <p className="text-2xl font-bold text-emerald-600">
              {properties.filter((p) => p.governmentVerified).length}
            </p>
            <p className="text-sm text-gray-500">Verified</p>
          </div>
          <div className="bg-white rounded-xl p-4 text-center shadow">
            <p className="text-2xl font-bold text-amber-600">
              {properties.filter((p) => !p.governmentVerified).length}
            </p>
            <p className="text-sm text-gray-500">Pending</p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <svg className="animate-spin h-12 w-12 text-indigo-600" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        ) : filteredProperties.length > 0 ? (
          <div className="grid gap-8 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {filteredProperties.map((property) => (
              <PropertyCard
                key={property.id}
                property={property}
                onAction={handleAction}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🏚️</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              No Properties Found
            </h3>
            <p className="text-gray-600">
              {filter !== "all"
                ? "Try changing your filter settings"
                : "Be the first to list a property!"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}