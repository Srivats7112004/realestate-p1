import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import { ethers } from "ethers";
import { useWeb3 } from "../../context/Web3Context";
import Navbar from "../../components/Navbar";
import StatusTimeline from "../../components/StatusTimeline";
import TransactionHistory from "../../components/TransactionHistory";
import AIInspectionPanel from "../../components/AIInspectionPanel";
import { shortenAddress, isZeroAddress } from "../../utils/helpers";

function RoleStatusBanner({ userRole, contractRoleStatus }) {
  if (!["government", "inspector", "lender"].includes(userRole)) return null;

  const hasRole =
    (userRole === "government" && contractRoleStatus.government) ||
    (userRole === "inspector" && contractRoleStatus.inspector) ||
    (userRole === "lender" && contractRoleStatus.lender);

  if (hasRole) {
    return (
      <div className="rounded-2xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">
        Connected wallet has <strong>{userRole.toUpperCase()}</strong> role on-chain.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
      Your app role is <strong>{userRole}</strong>, but the connected wallet does not currently have{" "}
      <strong>{userRole}</strong> permission on-chain.
    </div>
  );
}

function StatusPill({ children, tone = "default" }) {
  const tones = {
    green: "bg-green-100 text-green-700",
    amber: "bg-amber-100 text-amber-700",
    red: "bg-red-100 text-red-700",
    blue: "bg-blue-100 text-blue-700",
    slate: "bg-slate-100 text-slate-600",
    default: "bg-slate-100 text-slate-700",
  };

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${tones[tone] || tones.default}`}>
      {children}
    </span>
  );
}

export default function PropertyDetail() {
  const router = useRouter();
  const { id } = router.query;

  const {
    account,
    provider,
    escrow,
    properties,
    userRole,
    canUseConnectedWallet,
    canUseRoleWallet,
    contractRoleStatus,
    loadBlockchainData,
    loadTransactionHistory,
    runAIInspection,
  } = useWeb3();

  const [property, setProperty] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [aiReport, setAiReport] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");

  useEffect(() => {
    if (id && properties.length > 0) {
      const found = properties.find((p) => p.id === parseInt(id, 10));
      setProperty(found || null);
    }
  }, [id, properties]);

  const refreshHistory = async (tokenId) => {
    if (!tokenId) return;
    setHistoryLoading(true);
    const items = await loadTransactionHistory(tokenId);
    setHistory(items);
    setHistoryLoading(false);
  };

  useEffect(() => {
    if (property?.id) {
      refreshHistory(property.id);
    }
  }, [property?.id]);

  const buyerExists = useMemo(() => {
    return property ? !isZeroAddress(property.buyer) : false;
  }, [property]);

  const isSeller = useMemo(() => {
    if (!property || !account || !property.seller) return false;
    return account.toLowerCase() === property.seller.toLowerCase();
  }, [property, account]);

  const isBuyer = useMemo(() => {
    if (!property || !account || !property.buyer || isZeroAddress(property.buyer)) return false;
    return account.toLowerCase() === property.buyer.toLowerCase();
  }, [property, account]);

  const isOwner = useMemo(() => {
    if (!property || !account || !property.currentOwner) return false;
    return account.toLowerCase() === property.currentOwner.toLowerCase();
  }, [property, account]);

  const isNormalUser = userRole === "user" || userRole === "admin";

  const canActAsSeller = isNormalUser && isSeller && canUseConnectedWallet;
  const canActAsBuyer =
    isNormalUser &&
    !isSeller &&
    !property?.sold &&
    !buyerExists &&
    canUseConnectedWallet;

  const saleStatusText = useMemo(() => {
    if (!property) return "Loading";
    if (property.sold) return "Sold";
    if (buyerExists) return "In Progress";
    return "Available";
  }, [property, buyerExists]);

  const sellerCanFinalize = useMemo(() => {
    if (!property) return false;
    return (
      buyerExists &&
      property.governmentVerified &&
      property.inspectionPassed &&
      property.lenderApproved &&
      !property.sold
    );
  }, [property, buyerExists]);

  const handleAction = async (action) => {
    try {
      if (!provider || !escrow) {
        alert("Wallet or contract not ready.");
        return;
      }

      if (["verify", "inspect", "lend"].includes(action) && !canUseRoleWallet) {
        alert(`The connected wallet does not currently have ${userRole.toUpperCase()} permission on-chain.`);
        return;
      }

      if (["buy", "sell"].includes(action) && !canUseConnectedWallet) {
        alert(
          "The connected wallet does not match the wallet linked to your profile. Reconnect the correct wallet first."
        );
        return;
      }

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
          if (!sellerCanFinalize) {
            alert("Sale is not ready to finalize yet.");
            return;
          }

          let tx = await escrow.connect(signer).approveSale(property.id);
          await tx.wait();

          tx = await escrow.connect(signer).finalizeSale(property.id);
          await tx.wait();

          alert("Sale finalized!");
          break;
        }

        default:
          break;
      }

      await loadBlockchainData(false);
      await refreshHistory(property.id);
    } catch (error) {
      console.error(`${action} failed:`, error);
      alert(error?.reason || error?.message || `${action} failed.`);
    }
  };

  const handleAIRun = async (selectedProperty) => {
    try {
      setAiLoading(true);
      setAiError("");

      const report = await runAIInspection(selectedProperty);
      setAiReport(report);
    } catch (error) {
      setAiError(error.message || "AI inspection failed.");
    } finally {
      setAiLoading(false);
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
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden relative">
              <img
                src={property.image}
                alt={property.name}
                className="w-full h-96 object-cover"
                onError={(e) => {
                  e.target.src =
                    "https://via.placeholder.com/800x400?text=Property+Image";
                }}
              />

              <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                {property.sold ? <StatusPill tone="green">🎉 Sold</StatusPill> : null}
                {!property.sold && buyerExists ? <StatusPill tone="amber">⏳ In Progress</StatusPill> : null}
                {!property.sold && !buyerExists ? <StatusPill tone="blue">📋 Available</StatusPill> : null}
                {property.governmentVerified ? <StatusPill tone="green">🏛 Verified</StatusPill> : null}
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-8">
              <div className="flex items-start justify-between mb-4 gap-4">
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

                <div className="bg-slate-50 p-3 rounded-lg text-center">
                  <div className="text-lg">🧾</div>
                  <div className="text-xs text-slate-500">Status</div>
                  <div className="text-sm font-semibold text-slate-700">
                    {saleStatusText}
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-lg text-center">
                  <div className="text-lg">#️⃣</div>
                  <div className="text-xs text-slate-500">Token ID</div>
                  <div className="text-sm font-semibold text-slate-700">
                    #{property.id}
                  </div>
                </div>
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
                  <span className="text-slate-500">Current Owner</span>
                  <span className="font-mono text-slate-700">
                    {shortenAddress(property.currentOwner)}
                  </span>
                </div>

                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500">Escrow Amount</span>
                  <span className="font-semibold text-slate-700">
                    {ethers.utils.formatEther(property.escrowAmount)} ETH
                  </span>
                </div>

                <div className="flex justify-between py-2">
                  <span className="text-slate-500">Ownership Note</span>
                  <span className="text-right font-medium text-slate-700">
                    {isOwner
                      ? "This property is currently owned by your connected wallet"
                      : property.sold
                      ? "Ownership has already transferred to the buyer"
                      : "Ownership still remains with the seller"}
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

            <TransactionHistory history={history} loading={historyLoading} />

            {userRole === "inspector" ? (
              <AIInspectionPanel
                property={property}
                report={aiReport}
                loading={aiLoading}
                error={aiError}
                onRun={handleAIRun}
              />
            ) : null}
          </div>

          <div className="space-y-6">
            <RoleStatusBanner
              userRole={userRole}
              contractRoleStatus={contractRoleStatus}
            />

            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-slate-700 mb-4">📊 Sale Status</h3>
              <StatusTimeline property={property} />
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-slate-700 mb-4">⚡ Actions</h3>

              <div className="space-y-3">
                {userRole === "government" && (
                  <button
                    onClick={() => handleAction("verify")}
                    disabled={property.governmentVerified || !contractRoleStatus.government}
                    className="w-full bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
                  >
                    {property.governmentVerified ? "✅ Already Verified" : "🏛 Verify Property"}
                  </button>
                )}

                {userRole === "inspector" && (
                  <button
                    onClick={() => handleAction("inspect")}
                    disabled={property.inspectionPassed || !contractRoleStatus.inspector}
                    className="w-full bg-orange-500 text-white py-3 rounded-lg font-semibold hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
                  >
                    {property.inspectionPassed ? "✅ Inspection Passed" : "🔍 Approve Inspection"}
                  </button>
                )}

                {userRole === "lender" && (
                  <button
                    onClick={() => handleAction("lend")}
                    disabled={property.lenderApproved || !buyerExists || !contractRoleStatus.lender}
                    className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
                  >
                    {property.lenderApproved ? "✅ Loan Approved" : "🏦 Approve Loan"}
                  </button>
                )}

                {canActAsSeller && (
                  <button
                    onClick={() => handleAction("sell")}
                    disabled={!sellerCanFinalize}
                    className="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
                  >
                    {property.sold ? "🎉 Already Sold" : "✍️ Approve & Finalize Sale"}
                  </button>
                )}

                {canActAsBuyer && (
                  <button
                    onClick={() => handleAction("buy")}
                    disabled={buyerExists}
                    className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
                  >
                    {buyerExists ? "✅ Buyer Already Assigned" : `💰 Buy for ${property.price} ETH`}
                  </button>
                )}

                {isBuyer && property.sold ? (
                  <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-800">
                    You are the recorded buyer and current owner of this property.
                  </div>
                ) : null}

                {isSeller && property.sold ? (
                  <div className="rounded-lg bg-blue-50 border border-blue-200 px-4 py-3 text-sm text-blue-800">
                    You listed this property and the sale has been completed successfully.
                  </div>
                ) : null}
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-slate-700 mb-4">🖼 NFT Details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between gap-3">
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