// frontend/pages/dashboard/seller.js
import { useState } from "react";
import { ethers } from "ethers";
import { useWeb3 } from "../../context/Web3Context";
import Navbar from "../../components/Navbar";
import ListPropertyForm from "../../components/ListPropertyForm";
import PropertyCard from "../../components/PropertyCard";
import KYCBadge from "../../components/KYCBadge";

export default function SellerDashboard() {
  const { account, provider, escrow, properties, loadBlockchainData } = useWeb3();
  const [processingId, setProcessingId] = useState(null);
  const [statusMsg, setStatusMsg] = useState("");

  const myListings = properties.filter(
    (p) => p.seller && account && p.seller.toLowerCase() === account.toLowerCase()
  );

  const totalValue = myListings.reduce((sum, p) => sum + parseFloat(p.price || 0), 0);
  const pendingSales = myListings.filter((p) => p.buyerDeposited && !p.sellerApproved);
  const completedSales = myListings.filter((p) => p.sold);

  const handleAction = async (action, property) => {
    if (action !== "sell") return;
    setProcessingId(property.id);
    setStatusMsg("");

    try {
      const signer = provider.getSigner();

      // ── Pre-flight: read the live listing from chain ──────────────────────
      const listing = await escrow.listings(property.id);

      const buyerDeposited = listing.buyer !== ethers.constants.AddressZero;
      const contractBalance = await provider.getBalance(escrow.address);

      const blockers = [];
      if (!buyerDeposited)                                           blockers.push("❌ No buyer has deposited funds yet");
      if (!listing.inspectionPassed)                                 blockers.push("❌ Inspection not passed yet");
      if (!listing.lenderApproved)                                   blockers.push("❌ Lender has not approved yet");
      if (!listing.governmentVerified)                               blockers.push("❌ Government has not verified yet");
      if (contractBalance.lt(listing.purchasePrice))                 blockers.push("❌ Contract balance is less than purchase price");

      if (blockers.length > 0) {
        setProcessingId(null);
        setStatusMsg("");
        alert("⚠️ Cannot finalize yet. Blocking conditions:\n\n" + blockers.join("\n"));
        return;
      }
      // ─────────────────────────────────────────────────────────────────────

      // Step 1: Seller approves
      setStatusMsg(`Step 1/2 — Approving sale for Property #${property.id}…`);
      const approveTx = await escrow.connect(signer).approveSale(property.id);
      await approveTx.wait();

      // Sync chain state so finalizeSale reads sellerApproved = true
      await loadBlockchainData();

      // Step 2: Finalize
      setStatusMsg(`Step 2/2 — Finalizing sale for Property #${property.id}…`);
      const finalizeTx = await escrow.connect(signer).finalizeSale(property.id);
      await finalizeTx.wait();

      setStatusMsg("");
      alert("🎉 Sale finalized successfully!");
      loadBlockchainData();
    } catch (error) {
      console.error("Action failed:", error);
      setStatusMsg("");
      alert(error?.reason || error?.message || "Action failed.");
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0f0f13", fontFamily: "'DM Sans', 'Segoe UI', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; }
        .seller-bg { background: #0f0f13; position: relative; min-height: 100vh; }
        .seller-bg::before { content: ''; position: fixed; top: -30%; left: -10%; width: 60vw; height: 60vw; background: radial-gradient(circle, rgba(168,85,247,0.08) 0%, transparent 70%); pointer-events: none; z-index: 0; }
        .seller-bg::after { content: ''; position: fixed; bottom: -20%; right: -10%; width: 50vw; height: 50vw; background: radial-gradient(circle, rgba(99,102,241,0.07) 0%, transparent 70%); pointer-events: none; z-index: 0; }
        .page-content { position: relative; z-index: 1; max-width: 1280px; margin: 0 auto; padding: 2rem 1.5rem 4rem; }
        .page-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 2.5rem; gap: 1rem; flex-wrap: wrap; }
        .page-title { font-size: 2rem; font-weight: 700; color: #f1f0ff; letter-spacing: -0.03em; margin: 0 0 0.25rem; }
        .page-subtitle { font-size: 0.875rem; color: #6b6b8a; margin: 0; }
        .dot-accent { display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: linear-gradient(135deg, #a855f7, #6366f1); margin-right: 0.5rem; vertical-align: middle; box-shadow: 0 0 8px rgba(168,85,247,0.6); }
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 2.5rem; }
        .stat-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07); border-radius: 16px; padding: 1.5rem; position: relative; overflow: hidden; transition: border-color 0.2s, background 0.2s; }
        .stat-card:hover { background: rgba(255,255,255,0.05); border-color: rgba(255,255,255,0.12); }
        .stat-card::after { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 1px; background: linear-gradient(90deg, transparent, rgba(168,85,247,0.4), transparent); }
        .stat-icon { font-size: 1.25rem; margin-bottom: 0.75rem; display: block; }
        .stat-label { font-size: 0.75rem; color: #6b6b8a; text-transform: uppercase; letter-spacing: 0.08em; font-weight: 500; margin-bottom: 0.375rem; }
        .stat-value { font-size: 2rem; font-weight: 700; letter-spacing: -0.04em; line-height: 1; }
        .stat-value.purple { color: #c084fc; }
        .stat-value.indigo { color: #818cf8; }
        .stat-value.amber { color: #fbbf24; }
        .stat-value.green { color: #34d399; }
        .section-header { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1.25rem; margin-top: 2.5rem; }
        .section-title { font-size: 1rem; font-weight: 600; color: #d1d0f0; letter-spacing: -0.01em; }
        .section-count { font-size: 0.75rem; background: rgba(255,255,255,0.06); color: #8b8aaa; border-radius: 20px; padding: 0.2rem 0.6rem; font-family: 'DM Mono', monospace; }
        .section-line { flex: 1; height: 1px; background: rgba(255,255,255,0.06); }
        .form-wrapper { background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.07); border-radius: 20px; padding: 1.75rem; margin-bottom: 0.5rem; }
        .form-wrapper-title { font-size: 0.85rem; font-weight: 600; color: #a855f7; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 1.25rem; display: flex; align-items: center; gap: 0.5rem; }
        .status-banner { background: rgba(168,85,247,0.1); border: 1px solid rgba(168,85,247,0.3); border-radius: 12px; padding: 0.875rem 1.25rem; margin-bottom: 1.5rem; display: flex; align-items: center; gap: 0.75rem; color: #c084fc; font-size: 0.875rem; font-weight: 500; }
        .spinner { width: 16px; height: 16px; border: 2px solid rgba(168,85,247,0.3); border-top-color: #a855f7; border-radius: 50%; animation: spin 0.8s linear infinite; flex-shrink: 0; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .empty-state { text-align: center; padding: 3.5rem 2rem; background: rgba(255,255,255,0.02); border: 1px dashed rgba(255,255,255,0.08); border-radius: 20px; }
        .empty-icon { font-size: 2.5rem; margin-bottom: 0.75rem; }
        .empty-text { color: #6b6b8a; font-size: 0.9rem; }
        .property-grid { display: grid; gap: 1.25rem; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); }
        @media (max-width: 640px) { .page-title { font-size: 1.5rem; } .stats-grid { grid-template-columns: 1fr 1fr; } .property-grid { grid-template-columns: 1fr; } }
      `}</style>

      <Navbar />

      <div className="seller-bg">
        <div className="page-content">
          <div className="page-header">
            <div>
              <h1 className="page-title"><span className="dot-accent" />Seller Dashboard</h1>
              <p className="page-subtitle">Manage and finalize your property listings</p>
            </div>
            <KYCBadge address={account} showRequestButton={true} />
          </div>

          {statusMsg && (
            <div className="status-banner">
              <div className="spinner" />
              {statusMsg}
            </div>
          )}

          <div className="stats-grid">
            <div className="stat-card">
              <span className="stat-icon">🏠</span>
              <div className="stat-label">My Listings</div>
              <div className="stat-value purple">{myListings.length}</div>
            </div>
            <div className="stat-card">
              <span className="stat-icon">💎</span>
              <div className="stat-label">Total Value</div>
              <div className="stat-value indigo">{totalValue.toFixed(2)} <span style={{fontSize:"1rem",opacity:0.6}}>ETH</span></div>
            </div>
            <div className="stat-card">
              <span className="stat-icon">⏳</span>
              <div className="stat-label">Pending Sales</div>
              <div className="stat-value amber">{pendingSales.length}</div>
            </div>
            <div className="stat-card">
              <span className="stat-icon">✅</span>
              <div className="stat-label">Completed</div>
              <div className="stat-value green">{completedSales.length}</div>
            </div>
          </div>

          <div className="section-header">
            <span className="section-title">List a New Property</span>
            <div className="section-line" />
          </div>
          <div className="form-wrapper">
            <div className="form-wrapper-title"><span>+</span> New Listing</div>
            <ListPropertyForm onSuccess={loadBlockchainData} />
          </div>

          <div className="section-header">
            <span className="section-title">My Listed Properties</span>
            <span className="section-count">{myListings.length}</span>
            <div className="section-line" />
          </div>

          {myListings.length > 0 ? (
            <div className="property-grid">
              {myListings.map((property) => (
                <PropertyCard key={property.id} property={property} onAction={handleAction} />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">🏡</div>
              <p className="empty-text">You haven&apos;t listed any properties yet.<br />Use the form above to get started.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}