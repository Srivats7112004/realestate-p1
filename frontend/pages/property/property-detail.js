import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import { ethers } from "ethers";
import Navbar from "../../components/Navbar";
import StatusTimeline from "../../components/StatusTimeline";
import TransactionHistory from "../../components/TransactionHistory";
import AIInspectionPanel from "../../components/AIInspectionPanel";
import { useWeb3 } from "../../context/Web3Context";
import { shortenAddress, isZeroAddress } from "../../utils/helpers";
import {
  buildSaleChecklist,
  buildSaleChecklistFromProperty,
  getReadableErrorMessage,
} from "../../utils/escrow";

function StatusPill({ children, tone = "slate" }) {
  const tones = {
    slate: "border-slate-200 bg-slate-50 text-slate-700",
    sky: "border-sky-200 bg-sky-50 text-sky-700",
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-700",
    amber: "border-amber-200 bg-amber-50 text-amber-700",
    violet: "border-violet-200 bg-violet-50 text-violet-700",
    red: "border-red-200 bg-red-50 text-red-700",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-semibold ${tones[tone] || tones.slate}`}
    >
      {children}
    </span>
  );
}

function InfoCard({ label, value, breakAll = false }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="mb-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
        {label}
      </div>
      <div className={`text-sm font-medium text-slate-800 ${breakAll ? "break-all" : ""}`}>
        {value}
      </div>
    </div>
  );
}

function KeyMetric({ label, value, color = "text-slate-900" }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="mb-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
        {label}
      </div>
      <div className={`text-lg font-bold ${color}`}>{value}</div>
    </div>
  );
}

function RoleStatusBanner({ userRole, contractRoleStatus, canUseConnectedWallet, isNormalUser }) {
  if (isNormalUser && !canUseConnectedWallet) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        <div className="font-semibold">Connected wallet mismatch</div>
        <div className="mt-1">
          Your connected wallet does not match the wallet linked to your profile, so buyer and seller actions may be blocked.
        </div>
      </div>
    );
  }

  if (!["government", "inspector", "lender"].includes(userRole)) return null;

  const hasRole =
    (userRole === "government" && contractRoleStatus.government) ||
    (userRole === "inspector" && contractRoleStatus.inspector) ||
    (userRole === "lender" && contractRoleStatus.lender);

  return (
    <div
      className={`rounded-2xl border p-4 text-sm ${
        hasRole
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-amber-200 bg-amber-50 text-amber-800"
      }`}
    >
      {hasRole ? (
        <>
          <div className="font-semibold">Authorized role wallet detected</div>
          <div className="mt-1">
            The connected wallet can perform <strong>{userRole}</strong> actions on-chain.
          </div>
        </>
      ) : (
        <>
          <div className="font-semibold">Role wallet not authorized on-chain</div>
          <div className="mt-1">
            Your app role is <strong>{userRole}</strong>, but the connected wallet does not currently have that permission in the escrow contract.
          </div>
        </>
      )}
    </div>
  );
}

function safeFormatEth(value, fallback = "—") {
  try {
    if (value === undefined || value === null) return fallback;
    return `${ethers.utils.formatEther(value)} ETH`;
  } catch {
    return fallback;
  }
}

export default function PropertyDetailPage() {
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
  const [processingAction, setProcessingAction] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [aiReport, setAiReport] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");

  useEffect(() => {
    if (id && properties.length > 0) {
      const found = properties.find((item) => item.id === parseInt(id, 10));
      setProperty(found || null);
    }
  }, [id, properties]);

  const refreshHistory = async (tokenId) => {
    if (!tokenId || !loadTransactionHistory) return;

    try {
      setHistoryLoading(true);
      const items = await loadTransactionHistory(tokenId);
      setHistory(Array.isArray(items) ? items : []);
    } finally {
      setHistoryLoading(false);
    }
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

  const checklist = useMemo(() => buildSaleChecklistFromProperty(property), [property]);

  const sellerCanFinalize = useMemo(() => {
    if (!property) return false;

    return (
      checklist.buyerFunded &&
      checklist.governmentVerified &&
      checklist.inspectionPassed &&
      checklist.lenderApproved &&
      !property.sold
    );
  }, [property, checklist]);

  const propertyPriceText = useMemo(() => {
    if (!property) return "—";
    return property.price ? `${property.price} ETH` : safeFormatEth(property.purchasePrice, "—");
  }, [property]);

  const escrowAmountText = useMemo(() => {
    if (!property) return "—";
    return safeFormatEth(property.escrowAmount, property.price ? `${property.price} ETH` : "—");
  }, [property]);

  const handleAction = async (action) => {
    try {
      if (!provider || !escrow || !property) {
        alert("Wallet or contract not ready.");
        return;
      }

      setProcessingAction(action);
      setActionMessage("");

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
          setActionMessage("Depositing earnest money into escrow...");
          const tx = await escrow
            .connect(signer)
            .depositEarnest(property.id, { value: property.purchasePrice });
          await tx.wait();
          alert("Payment deposited successfully!");
          break;
        }

        case "inspect": {
          setActionMessage("Recording inspection approval on-chain...");
          const tx = await escrow
            .connect(signer)
            .updateInspectionStatus(property.id, true);
          await tx.wait();
          alert("Inspection approved!");
          break;
        }

        case "lend": {
          setActionMessage("Recording lender approval on-chain...");
          const tx = await escrow.connect(signer).approveSale(property.id);
          await tx.wait();
          alert("Loan approved!");
          break;
        }

        case "verify": {
          setActionMessage("Recording government verification...");
          const tx = await escrow.connect(signer).verifyProperty(property.id);
          await tx.wait();
          alert("Property verified!");
          break;
        }

        case "sell": {
          const liveListing = await escrow.listings(property.id);
          const contractBalance = await provider.getBalance(escrow.address);

          const beforeApproval = buildSaleChecklist({
            listing: liveListing,
            contractBalance,
          });

          const hardBlockers = beforeApproval.blockers.filter(
            (item) => item !== "Seller approval has not been recorded on-chain yet."
          );

          if (hardBlockers.length > 0) {
            alert(`Sale is not ready yet.\n\n${hardBlockers.map((item) => `• ${item}`).join("\n")}`);
            return;
          }

          setActionMessage("Recording seller approval on-chain...");
          let tx = await escrow.connect(signer).approveSale(property.id);
          await tx.wait();

          await loadBlockchainData(false);

          const refreshedListing = await escrow.listings(property.id);
          const refreshedBalance = await provider.getBalance(escrow.address);

          const afterApproval = buildSaleChecklist({
            listing: refreshedListing,
            contractBalance: refreshedBalance,
          });

          if (!afterApproval.sellerApproved) {
            throw new Error("Seller approval is still missing on-chain after approval transaction.");
          }

          if (!afterApproval.readyToFinalize) {
            throw new Error(afterApproval.blockers.join(" "));
          }

          setActionMessage("Finalizing sale and transferring ownership...");
          tx = await escrow.connect(signer).finalizeSale(property.id);
          await tx.wait();

          alert("Sale finalized successfully!");
          break;
        }

        default:
          break;
      }

      await loadBlockchainData(false);
      await refreshHistory(property.id);
    } catch (error) {
      console.error(`${action} failed:`, error);
      alert(getReadableErrorMessage(error));
    } finally {
      setProcessingAction("");
      setActionMessage("");
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
      <div className="app-shell min-h-screen">
        <Navbar />
        <main className="app-container py-20">
          <div className="surface-card-strong py-20 text-center">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full border-4 border-sky-500 border-t-transparent animate-spin" />
            <h3 className="text-xl font-semibold text-slate-800">
              Loading property details
            </h3>
            <p className="mt-2 text-slate-500">
              Syncing property information from the marketplace.
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="app-shell min-h-screen">
      <Navbar />

      <main className="app-container py-8 md:py-10">
        <button
          onClick={() => router.push("/")}
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
        >
          ← Back to Marketplace
        </button>

        {/* Hero */}
        <section className="animate-fadeIn">
          <div className="surface-card-strong overflow-hidden">
            <div className="grid lg:grid-cols-[1.05fr_0.95fr]">
              <div className="relative min-h-[340px]">
                <img
                  src={property.image}
                  alt={property.name || `Property ${property.id}`}
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    e.target.src =
                      "https://via.placeholder.com/1200x700?text=Property+Image";
                  }}
                />

                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/55 via-slate-900/10 to-transparent" />

                <div className="absolute left-5 top-5 flex flex-wrap gap-2">
                  {property.sold ? <StatusPill tone="emerald">🎉 Sold</StatusPill> : null}
                  {!property.sold && buyerExists ? <StatusPill tone="amber">⏳ In Progress</StatusPill> : null}
                  {!property.sold && !buyerExists ? <StatusPill tone="sky">📋 Available</StatusPill> : null}
                  {property.governmentVerified ? <StatusPill tone="emerald">🏛 Verified</StatusPill> : null}
                  {property.propertyType ? <StatusPill tone="slate">{property.propertyType}</StatusPill> : null}
                </div>

                <div className="absolute bottom-5 left-5 right-5">
                  <div className="max-w-3xl">
                    <div className="mb-3 inline-flex items-center rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold text-sky-700 backdrop-blur">
                      Property #{property.id}
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
                      {property.name || `Property #${property.id}`}
                    </h1>
                    <p className="mt-2 text-sm text-white/85 md:text-base">
                      {property.location || "Location unavailable"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="px-6 py-6 md:px-8 md:py-8">
                <div className="page-kicker mb-4">
                  <span className="page-dot" />
                  Property overview
                </div>

                <div className="mb-4 flex flex-wrap items-center gap-3">
                  <div className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3">
                    <div className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-500">
                      Listing Price
                    </div>
                    <div className="mt-1 text-2xl font-bold text-sky-700">
                      {propertyPriceText}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                      Status
                    </div>
                    <div className="mt-1 text-lg font-bold text-slate-900">
                      {saleStatusText}
                    </div>
                  </div>
                </div>

                {property.description ? (
                  <div className="mb-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                      Description
                    </div>
                    <p className="text-sm leading-7 text-slate-600">
                      {property.description}
                    </p>
                  </div>
                ) : null}

                <div className="grid gap-4 sm:grid-cols-2">
                  <KeyMetric
                    label="Area"
                    value={property.area ? `${property.area} sq ft` : "Not specified"}
                    color="text-slate-900"
                  />
                  <KeyMetric
                    label="Escrow"
                    value={escrowAmountText}
                    color="text-violet-600"
                  />
                  <KeyMetric
                    label="Bedrooms"
                    value={property.bedrooms || "—"}
                    color="text-slate-900"
                  />
                  <KeyMetric
                    label="Bathrooms"
                    value={property.bathrooms || "—"}
                    color="text-slate-900"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Main layout */}
        <section className="pt-8">
          <div className="grid gap-8 xl:grid-cols-[1.2fr_0.8fr]">
            {/* Left */}
            <div className="space-y-8">
              <div className="surface-card-strong p-6 md:p-8 animate-fadeIn">
                <div className="mb-6">
                  <div className="page-kicker mb-3">
                    <span className="page-dot" />
                    Ownership and identity
                  </div>
                  <h2 className="section-heading">Property ownership details</h2>
                  <p className="section-subtext mt-2">
                    View the seller, buyer, and current owner associated with this NFT-backed property.
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <InfoCard label="Seller" value={shortenAddress(property.seller)} />
                  <InfoCard
                    label="Buyer"
                    value={buyerExists ? shortenAddress(property.buyer) : "No buyer assigned yet"}
                  />
                  <InfoCard label="Current Owner" value={shortenAddress(property.currentOwner)} />
                  <InfoCard
                    label="Ownership Status"
                    value={
                      isOwner
                        ? "Your connected wallet is the current owner"
                        : property.sold
                        ? "Ownership has already transferred to the buyer"
                        : "Ownership still remains with the seller"
                    }
                  />
                  <InfoCard
                    label="Token URI"
                    value={property.uri || "Not available"}
                    breakAll
                  />
                  <InfoCard
                    label="Property Document"
                    value={property.documents ? "Available" : "Not attached"}
                  />
                </div>

                {property.documents ? (
                  <a
                    href={property.documents}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="secondary-btn mt-5 inline-flex px-5 py-3 text-sm"
                  >
                    View Attached Property Document
                  </a>
                ) : null}
              </div>

              <div className="animate-fadeIn">
                <TransactionHistory history={history} loading={historyLoading} />
              </div>

              {userRole === "inspector" ? (
                <div className="animate-fadeIn">
                  <AIInspectionPanel
                    property={property}
                    report={aiReport}
                    loading={aiLoading}
                    error={aiError}
                    onRun={handleAIRun}
                  />
                </div>
              ) : null}
            </div>

            {/* Right */}
            <div className="space-y-8">
              <div className="animate-fadeIn">
                <RoleStatusBanner
                  userRole={userRole}
                  contractRoleStatus={contractRoleStatus}
                  canUseConnectedWallet={canUseConnectedWallet}
                  isNormalUser={isNormalUser}
                />
              </div>

              <div className="surface-card-strong p-6 md:p-7 animate-fadeIn">
                <div className="mb-5">
                  <div className="page-kicker mb-3">
                    <span className="page-dot" />
                    Action center
                  </div>
                  <h2 className="section-heading">Role-based actions</h2>
                  <p className="section-subtext mt-2">
                    Use the current connected wallet to move this property through the sale workflow.
                  </p>
                </div>

                {actionMessage ? (
                  <div className="mb-5 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-4 text-sm text-sky-700">
                    <div className="font-semibold">Processing action</div>
                    <div className="mt-1">{actionMessage}</div>
                  </div>
                ) : null}

                <div className="mb-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-800">
                      Finalize readiness
                    </span>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        checklist.readyToFinalize
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {checklist.readyToFinalize ? "Ready" : "Waiting"}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {[
                      ["Buyer funded", checklist.buyerFunded],
                      ["Inspection", checklist.inspectionPassed],
                      ["Lender", checklist.lenderApproved],
                      ["Government", checklist.governmentVerified],
                      ["Seller", checklist.sellerApproved],
                      ["Escrow funded", checklist.sufficientFunds],
                    ].map(([label, done]) => (
                      <div
                        key={label}
                        className={`rounded-xl border px-3 py-2 ${
                          done
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                            : "border-slate-200 bg-white text-slate-500"
                        }`}
                      >
                        <span className="mr-1">{done ? "✅" : "⏳"}</span>
                        {label}
                      </div>
                    ))}
                  </div>

                  {checklist.blockers.length > 0 ? (
                    <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
                      <div className="mb-1 font-semibold">Current blockers</div>
                      <div className="space-y-1">
                        {checklist.blockers.map((item) => (
                          <div key={item}>• {item}</div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>

                <div className="space-y-3">
                  {userRole === "government" && (
                    <button
                      onClick={() => handleAction("verify")}
                      disabled={Boolean(processingAction) || property.governmentVerified || !contractRoleStatus.government}
                      className="primary-btn w-full px-5 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {processingAction === "verify"
                        ? "Processing..."
                        : property.governmentVerified
                        ? "Already Verified"
                        : "Verify Property"}
                    </button>
                  )}

                  {userRole === "inspector" && (
                    <button
                      onClick={() => handleAction("inspect")}
                      disabled={Boolean(processingAction) || property.inspectionPassed || !contractRoleStatus.inspector}
                      className="primary-btn w-full px-5 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {processingAction === "inspect"
                        ? "Processing..."
                        : property.inspectionPassed
                        ? "Inspection Passed"
                        : "Approve Inspection"}
                    </button>
                  )}

                  {userRole === "lender" && (
                    <button
                      onClick={() => handleAction("lend")}
                      disabled={Boolean(processingAction) || property.lenderApproved || !buyerExists || !contractRoleStatus.lender}
                      className="primary-btn w-full px-5 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {processingAction === "lend"
                        ? "Processing..."
                        : property.lenderApproved
                        ? "Loan Approved"
                        : "Approve Loan"}
                    </button>
                  )}

                  {canActAsSeller && (
                    <button
                      onClick={() => handleAction("sell")}
                      disabled={Boolean(processingAction) || !sellerCanFinalize}
                      className="primary-btn w-full px-5 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {processingAction === "sell"
                        ? "Processing..."
                        : property.sold
                        ? "Already Sold"
                        : "Approve & Finalize Sale"}
                    </button>
                  )}

                  {canActAsBuyer && (
                    <button
                      onClick={() => handleAction("buy")}
                      disabled={Boolean(processingAction) || buyerExists}
                      className="primary-btn w-full px-5 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {processingAction === "buy"
                        ? "Processing..."
                        : buyerExists
                        ? "Buyer Already Assigned"
                        : `Buy for ${property.price || ethers.utils.formatEther(property.purchasePrice)} ETH`}
                    </button>
                  )}
                </div>

                {isBuyer && property.sold ? (
                  <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm text-emerald-700">
                    <div className="font-semibold">Ownership confirmed</div>
                    <div className="mt-1">
                      You are the recorded buyer and current owner of this property.
                    </div>
                  </div>
                ) : null}

                {isSeller && property.sold ? (
                  <div className="mt-4 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-4 text-sm text-sky-700">
                    <div className="font-semibold">Sale completed</div>
                    <div className="mt-1">
                      You listed this property and the sale has been finalized successfully.
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="animate-fadeIn">
                <StatusTimeline property={property} />
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}