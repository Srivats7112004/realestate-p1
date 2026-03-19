// frontend/pages/property/property-detail.js
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { ethers } from "ethers";
import { useWeb3 } from "../../context/Web3Context"; // Note: ../../ because it's nested
import Navbar from "../../components/Navbar";
import StatusTimeline from "../../components/StatusTimeline";
import { shortenAddress, isZeroAddress } from "../../utils/helpers";
import { ROLES } from "../../utils/constants";

export default function PropertyDetail() {
  const router = useRouter();
  const { id } = router.query;
  
  // ... rest of your code

  const {
    account,
    provider,
    escrow,
    properties,
    userRole,
    loadBlockchainData,
  } = useWeb3();

  const [property, setProperty] = useState(null);

  useEffect(() => {
    if (id && properties.length > 0) {
      const found = properties.find((p) => p.id === parseInt(id));
      setProperty(found || null);
    }
  }, [id, properties]);

  const handleAction = async (action) => {
    try {
      const signer = provider.getSigner();

      switch (action) {
        case "buy": {
          const tx = await escrow
            .connect(signer)
            .depositEarnest(property.id, { value: property.purchasePrice });
          await tx.wait();
          alert("Payment deposited!");
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
          const tx = await escrow.connect(signer).approveSale(property.id);
          await tx.wait();
          alert("Lender approved!");
          break;
        }
        case "verify": {
          const tx = await escrow.connect(signer).verifyProperty(property.id);
          await tx.wait();
          alert("Government verified!");
          break;
        }
        case "sell": {
          let tx = await escrow.connect(signer).approveSale(property.id);
          await tx.wait();
          tx = await escrow.connect(signer).finalizeSale(property.id);
          await tx.wait();
          alert("Sale finalized!");
          break;
        }
      }

      loadBlockchainData();
    } catch (error) {
      console.error(`${action} failed:`, error);
      alert(error?.reason || error?.message || `${action} failed.`);
    }
  };

  if (!property) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="text-center py-20">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-500">Loading property details...</p>
        </div>
      </div>
    );
  }

  const buyerExists = !isZeroAddress(property.buyer);
  const isSeller =
    account &&
    property.seller &&
    account.toLowerCase() === property.seller.toLowerCase();

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 md:px-6 py-8">
        <button
          onClick={() => router.push("/")}
          className="text-sm text-indigo-600 hover:text-indigo-800 mb-6 flex items-center gap-1 font-medium"
        >
          ← Back to Marketplace
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <img
                src={property.image}
                alt={property.name}
                className="w-full h-96 object-cover"
                onError={(e) => {
                  e.target.src =
                    "https://via.placeholder.com/800x400?text=Property+Image";
                }}
              />
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-8">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-slate-800">
                    {property.name || `Property #${property.id}`}
                  </h1>
                  {property.location && (
                    <p className="text-slate-500 flex items-center gap-1 mt-1">
                      📍 {property.location}
                    </p>
                  )}
                </div>
                <span className="text-3xl font-bold text-indigo-600">
                  {property.price} ETH
                </span>
              </div>

              {property.description && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-slate-500 uppercase mb-2">
                    Description
                  </h3>
                  <p className="text-slate-600">{property.description}</p>
                </div>
              )}

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {property.propertyType && (
                  <div className="bg-slate-50 p-3 rounded-lg text-center">
                    <div className="text-lg">🏠</div>
                    <div className="text-xs text-slate-500">Type</div>
                    <div className="text-sm font-semibold text-slate-700">
                      {property.propertyType}
                    </div>
                  </div>
                )}
                {property.area && (
                  <div className="bg-slate-50 p-3 rounded-lg text-center">
                    <div className="text-lg">📐</div>
                    <div className="text-xs text-slate-500">Area</div>
                    <div className="text-sm font-semibold text-slate-700">
                      {property.area} sq ft
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500">Seller</span>
                  <span className="font-mono text-slate-700">
                    {shortenAddress(property.seller)}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500">Buyer</span>
                  <span className="font-mono text-slate-700">
                    {buyerExists ? shortenAddress(property.buyer) : "None yet"}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500">Escrow Amount</span>
                  <span className="font-semibold text-slate-700">
                    {ethers.utils.formatEther(property.escrowAmount)} ETH
                  </span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-slate-500">Token ID</span>
                  <span className="font-semibold text-slate-700">
                    #{property.id}
                  </span>
                </div>
              </div>

              {property.documents && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <a
                    href={property.documents}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 text-sm font-medium hover:text-blue-800 flex items-center gap-2"
                  >
                    📄 View Property Document
                  </a>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-slate-700 mb-4">
                📊 Sale Status
              </h3>
              <StatusTimeline property={property} />
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-slate-700 mb-4">
                ⚡ Actions
              </h3>

              <div className="space-y-3">
                {account &&
                  account.toLowerCase() ===
                    ROLES.government.toLowerCase() && (
                    <button
                      onClick={() => handleAction("verify")}
                      disabled={property.governmentVerified}
                      className="w-full bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
                    >
                      {property.governmentVerified
                        ? "✅ Already Verified"
                        : "🏛 Verify Ownership"}
                    </button>
                  )}

                {account &&
                  account.toLowerCase() ===
                    ROLES.inspector.toLowerCase() && (
                    <button
                      onClick={() => handleAction("inspect")}
                      disabled={property.inspectionPassed}
                      className="w-full bg-orange-500 text-white py-3 rounded-lg font-semibold hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
                    >
                      {property.inspectionPassed
                        ? "✅ Inspection Passed"
                        : "🔍 Approve Inspection"}
                    </button>
                  )}

                {account &&
                  account.toLowerCase() === ROLES.lender.toLowerCase() && (
                    <button
                      onClick={() => handleAction("lend")}
                      disabled={property.lenderApproved}
                      className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
                    >
                      {property.lenderApproved
                        ? "✅ Loan Approved"
                        : "🏦 Approve Loan"}
                    </button>
                  )}

                {isSeller && (
                  <button
                    onClick={() => handleAction("sell")}
                    className="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition"
                  >
                    ✍️ Approve & Finalize Sale
                  </button>
                )}

                {userRole === "user" && !isSeller && (
                  <button
                    onClick={() => handleAction("buy")}
                    disabled={buyerExists}
                    className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
                  >
                    {buyerExists
                      ? "✅ Buyer Already Funded"
                      : `💰 Buy for ${property.price} ETH`}
                  </button>
                )}
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-slate-700 mb-4">
                🖼 NFT Details
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Token URI</span>
                  <a
                    href={property.uri}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 hover:text-indigo-800 text-xs"
                  >
                    View on IPFS ↗
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}