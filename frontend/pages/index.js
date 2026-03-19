// frontend/pages/index.js
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useWeb3 } from "../context/Web3Context";
import Navbar from "../components/Navbar";
import PropertyCard from "../components/PropertyCard";
import PropertyFilter from "../components/PropertyFilter";
import ListPropertyForm from "../components/ListPropertyForm";

export default function Home() {
  const router = useRouter();
  const {
    account,
    provider,
    escrow,
    properties,
    loading,
    userRole,
    loadBlockchainData,
  } = useWeb3();

  const [filteredProperties, setFilteredProperties] = useState([]);
  const [showListForm, setShowListForm] = useState(false);

  // Redirect to landing if not connected
  useEffect(() => {
    if (!loading && !account) {
      router.push("/landing");
    }
  }, [account, loading, router]);

  useEffect(() => {
    setFilteredProperties(properties);
  }, [properties]);

  // ... rest of your existing code stays the same

  // Action handlers
  const handleAction = async (action, property) => {
    try {
      const signer = provider.getSigner();

      switch (action) {
        case "buy": {
          const tx = await escrow
            .connect(signer)
            .depositEarnest(property.id, { value: property.purchasePrice });
          await tx.wait();
          alert("Payment deposited successfully!");
          break;
        }
        case "inspect": {
          const tx = await escrow
            .connect(signer)
            .updateInspectionStatus(property.id, true);
          await tx.wait();
          alert("Inspection approved!");
          break;
        }
        case "lend": {
          const tx = await escrow
            .connect(signer)
            .approveSale(property.id);
          await tx.wait();
          alert("Lender approved!");
          break;
        }
        case "verify": {
          const tx = await escrow
            .connect(signer)
            .verifyProperty(property.id);
          await tx.wait();
          alert("Government verification complete!");
          break;
        }
        case "sell": {
          let tx = await escrow
            .connect(signer)
            .approveSale(property.id);
          await tx.wait();

          tx = await escrow
            .connect(signer)
            .finalizeSale(property.id);
          await tx.wait();
          alert("Sale completed successfully!");
          break;
        }
        default:
          break;
      }

      loadBlockchainData();
    } catch (error) {
      console.error(`${action} failed:`, error);
      alert(error?.reason || error?.message || `${action} failed.`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      <Navbar />

      {/* Hero Section */}
      <div className="text-center py-12 px-4">
        <h2 className="text-5xl font-bold text-slate-800 mb-3">
          Decentralized Real Estate
        </h2>
        <p className="text-lg text-slate-500 max-w-2xl mx-auto">
          Buy, sell, verify, and transfer property ownership securely on the
          blockchain. No intermediaries. Full transparency.
        </p>

        {/* Stats */}
        <div className="flex justify-center gap-8 mt-8">
          <div className="bg-white rounded-xl shadow px-6 py-4">
            <div className="text-3xl font-bold text-indigo-600">
              {properties.length}
            </div>
            <div className="text-sm text-slate-500">Properties Listed</div>
          </div>
          <div className="bg-white rounded-xl shadow px-6 py-4">
            <div className="text-3xl font-bold text-green-600">
              {properties.filter((p) => p.governmentVerified).length}
            </div>
            <div className="text-sm text-slate-500">Verified</div>
          </div>
          <div className="bg-white rounded-xl shadow px-6 py-4">
            <div className="text-3xl font-bold text-purple-600">
              {properties.filter((p) => p.buyerDeposited).length}
            </div>
            <div className="text-sm text-slate-500">In Escrow</div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 pb-16">
        {/* List Property Toggle */}
        {account && (userRole === "user") && (
          <div className="mb-8">
            <button
              onClick={() => setShowListForm(!showListForm)}
              className="bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold shadow hover:bg-purple-700 transition flex items-center gap-2"
            >
              {showListForm ? "✕ Close Form" : "➕ List New Property"}
            </button>

            {showListForm && (
              <div className="mt-6 max-w-3xl">
                <ListPropertyForm
                  onSuccess={() => {
                    setShowListForm(false);
                    loadBlockchainData();
                  }}
                />
              </div>
            )}
          </div>
        )}

        {/* Search & Filter */}
        {properties.length > 0 && (
          <PropertyFilter
            properties={properties}
            onFilter={setFilteredProperties}
          />
        )}

        {/* Loading State */}
        {loading ? (
          <div className="text-center py-20">
            <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-500 text-lg">
              Loading properties from blockchain...
            </p>
          </div>
        ) : filteredProperties.length > 0 ? (
          <>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-slate-700">
                🏘 Available Properties ({filteredProperties.length})
              </h3>
            </div>

            <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {filteredProperties.map((property) => (
                <PropertyCard
                  key={property.id}
                  property={property}
                  onAction={handleAction}
                />
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🏗</div>
            <h3 className="text-2xl font-bold text-slate-600 mb-2">
              No Properties Found
            </h3>
            <p className="text-slate-400">
              {properties.length === 0
                ? "Be the first to list a property on the blockchain!"
                : "Try adjusting your filters."}
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-8 mt-8">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-slate-500 text-sm">
            🏠 BlockEstate — Blockchain-Based Real Estate Management System
          </p>
          <p className="text-slate-400 text-xs mt-1">
            Built with Solidity • Hardhat • Next.js • Ethers.js • IPFS
          </p>
        </div>
      </footer>
    </div>
  );
}