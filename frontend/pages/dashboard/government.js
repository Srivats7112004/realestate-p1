// frontend/pages/dashboard/government.js
import { useState } from "react";
import { useWeb3 } from "../../context/Web3Context";
import Navbar from "../../components/Navbar";
import PropertyCard from "../../components/PropertyCard";
import AuthGuard from "../../components/AuthGuard";

function GovernmentDashboardInner() {
  const { provider, escrow, properties, loadBlockchainData, kycStatus, approveKYC, rejectKYC, canUseRoleWallet, requiredRoleWallet } = useWeb3();
  const [activeTab, setActiveTab] = useState("unverified");

  const unverified = properties.filter((p) => !p.governmentVerified);
  const verified = properties.filter((p) => p.governmentVerified);
  const pendingKYC = Object.entries(kycStatus || {}).filter(([_, s]) => s === "pending").map(([addr]) => addr);

  const handleAction = async (action, property) => {
    if (action !== "verify") return;
    if (!provider || !escrow) return alert("Wallet or contract not ready.");
    if (!canUseRoleWallet) return alert(requiredRoleWallet ? `Government wallet required:\n${requiredRoleWallet}` : "Cannot perform this action with current wallet.");
    try {
      const signer = provider.getSigner();
      const tx = await escrow.connect(signer).verifyProperty(property.id);
      await tx.wait();
      alert("🏛️ Property verified!");
      await loadBlockchainData();
    } catch (error) {
      alert(error?.reason || error?.message || "Verification failed.");
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0a0d0f", fontFamily: "'DM Sans', 'Segoe UI', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; }
        .gov-bg { background: #0a0d0f; position: relative; min-height: 100vh; }
        .gov-bg::before { content: ''; position: fixed; top: -10%; right: 5%; width: 55vw; height: 55vw; background: radial-gradient(circle, rgba(16,185,129,0.06) 0%, transparent 65%); pointer-events: none; z-index: 0; }
        .gov-bg::after { content: ''; position: fixed; bottom: 5%; left: -10%; width: 40vw; height: 40vw; background: radial-gradient(circle, rgba(234,179,8,0.05) 0%, transparent 65%); pointer-events: none; z-index: 0; }
        .page-content { position: relative; z-index: 1; max-width: 1280px; margin: 0 auto; padding: 2rem 1.5rem 4rem; }
        .page-title { font-size: 2rem; font-weight: 700; color: #f0f2ee; letter-spacing: -0.03em; margin: 0 0 0.25rem; }
        .page-subtitle { font-size: 0.875rem; color: #4a5568; margin: 0 0 2rem; }
        .wallet-banner { border-radius: 14px; padding: 1rem 1.25rem; margin-bottom: 1.5rem; font-size: 0.85rem; font-weight: 500; border: 1px solid; }
        .wallet-banner.warn { background: rgba(234,179,8,0.07); border-color: rgba(234,179,8,0.25); color: #eab308; }
        .wallet-banner.ok { background: rgba(16,185,129,0.07); border-color: rgba(16,185,129,0.2); color: #10b981; }
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap: 1rem; margin-bottom: 2.5rem; }
        .stat-card { background: rgba(255,255,255,0.025); border: 1px solid rgba(255,255,255,0.06); border-radius: 14px; padding: 1.25rem 1.5rem; transition: all 0.2s; }
        .stat-card:hover { background: rgba(255,255,255,0.04); transform: translateY(-1px); }
        .stat-label { font-size: 0.72rem; color: #4a5568; text-transform: uppercase; letter-spacing: 0.09em; font-weight: 500; margin-bottom: 0.4rem; }
        .stat-value { font-size: 1.875rem; font-weight: 700; letter-spacing: -0.04em; }
        .stat-value.slate { color: #9ca3af; }
        .stat-value.orange { color: #f97316; }
        .stat-value.green { color: #10b981; }
        .stat-value.yellow { color: #eab308; }
        .kyc-panel { background: rgba(255,255,255,0.02); border: 1px solid rgba(234,179,8,0.15); border-radius: 18px; padding: 1.5rem; margin-bottom: 2rem; }
        .kyc-panel-title { font-size: 0.9rem; font-weight: 600; color: #d4a800; margin-bottom: 1.25rem; text-transform: uppercase; letter-spacing: 0.08em; display: flex; align-items: center; gap: 0.5rem; }
        .kyc-badge { background: rgba(234,179,8,0.1); border: 1px solid rgba(234,179,8,0.25); border-radius: 20px; padding: 0.15rem 0.6rem; font-size: 0.72rem; color: #eab308; font-family: 'DM Mono', monospace; }
        .kyc-item { display: flex; align-items: center; justify-content: space-between; padding: 0.875rem 1rem; background: rgba(234,179,8,0.05); border: 1px solid rgba(234,179,8,0.1); border-radius: 10px; margin-bottom: 0.625rem; gap: 1rem; flex-wrap: wrap; }
        .kyc-addr { font-family: 'DM Mono', monospace; font-size: 0.8rem; color: #d4d0aa; }
        .kyc-actions { display: flex; gap: 0.5rem; flex-shrink: 0; }
        .kyc-btn { padding: 0.45rem 1rem; border-radius: 8px; border: none; cursor: pointer; font-family: inherit; font-size: 0.8rem; font-weight: 600; transition: all 0.15s; }
        .kyc-btn.approve { background: rgba(16,185,129,0.15); color: #10b981; border: 1px solid rgba(16,185,129,0.3); }
        .kyc-btn.approve:hover { background: rgba(16,185,129,0.25); }
        .kyc-btn.reject { background: rgba(239,68,68,0.1); color: #ef4444; border: 1px solid rgba(239,68,68,0.25); }
        .kyc-btn.reject:hover { background: rgba(239,68,68,0.2); }
        .tabs-row { display: flex; gap: 0.25rem; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; padding: 0.25rem; max-width: 420px; margin-bottom: 2rem; }
        .tab-btn { flex: 1; padding: 0.6rem 1rem; border-radius: 9px; border: none; cursor: pointer; font-family: inherit; font-size: 0.85rem; font-weight: 500; transition: all 0.2s; background: transparent; color: #4a5568; }
        .tab-btn.active { background: rgba(16,185,129,0.12); color: #10b981; border: 1px solid rgba(16,185,129,0.25); }
        .tab-btn:hover:not(.active) { color: #6b7280; }
        .property-grid { display: grid; gap: 1.25rem; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); }
        .empty-state { text-align: center; padding: 3rem 2rem; background: rgba(255,255,255,0.015); border: 1px dashed rgba(255,255,255,0.07); border-radius: 18px; }
        .empty-icon { font-size: 2rem; margin-bottom: 0.75rem; }
        .empty-text { color: #4a5568; font-size: 0.875rem; }
        @media (max-width: 640px) { .page-title { font-size: 1.5rem; } .stats-grid { grid-template-columns: 1fr 1fr; } .property-grid { grid-template-columns: 1fr; } .kyc-item { flex-direction: column; align-items: flex-start; } }
      `}</style>

      <Navbar />

      <div className="gov-bg">
        <div className="page-content">
          <h1 className="page-title">🏛️ Government Dashboard</h1>
          <p className="page-subtitle">Verify property ownership and manage KYC approvals</p>

          <div className={`wallet-banner ${canUseRoleWallet ? "ok" : "warn"}`}>
            {canUseRoleWallet
              ? "✅ Connected wallet is authorised for government on-chain actions."
              : <>⚠️ App role is <strong>government</strong> but the smart contract requires the configured government wallet.{requiredRoleWallet && <><br />Required: <code style={{fontFamily:"'DM Mono',monospace"}}>{requiredRoleWallet}</code></>}</>
            }
          </div>

          <div className="stats-grid">
            <div className="stat-card"><div className="stat-label">Total</div><div className="stat-value slate">{properties.length}</div></div>
            <div className="stat-card"><div className="stat-label">Pending Verification</div><div className="stat-value orange">{unverified.length}</div></div>
            <div className="stat-card"><div className="stat-label">Verified</div><div className="stat-value green">{verified.length}</div></div>
            <div className="stat-card"><div className="stat-label">Pending KYC</div><div className="stat-value yellow">{pendingKYC.length}</div></div>
          </div>

          {pendingKYC.length > 0 && (
            <div className="kyc-panel">
              <div className="kyc-panel-title">📋 KYC Requests <span className="kyc-badge">{pendingKYC.length} pending</span></div>
              {pendingKYC.map((address) => (
                <div key={address} className="kyc-item">
                  <div className="kyc-addr">{address}</div>
                  <div className="kyc-actions">
                    <button className="kyc-btn approve" onClick={() => approveKYC(address)}>✅ Approve</button>
                    <button className="kyc-btn reject" onClick={() => rejectKYC(address)}>✗ Reject</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="tabs-row">
            <button className={`tab-btn ${activeTab === "unverified" ? "active" : ""}`} onClick={() => setActiveTab("unverified")}>⏳ Pending ({unverified.length})</button>
            <button className={`tab-btn ${activeTab === "verified" ? "active" : ""}`} onClick={() => setActiveTab("verified")}>✅ Verified ({verified.length})</button>
          </div>

          {activeTab === "unverified" && (
            unverified.length > 0 ? (
              <div className="property-grid">
                {unverified.map((p) => <PropertyCard key={p.id} property={p} onAction={handleAction} />)}
              </div>
            ) : (
              <div className="empty-state"><div className="empty-icon">✅</div><p className="empty-text">All properties are verified!</p></div>
            )
          )}

          {activeTab === "verified" && (
            verified.length > 0 ? (
              <div className="property-grid">
                {verified.map((p) => <PropertyCard key={p.id} property={p} onAction={handleAction} />)}
              </div>
            ) : (
              <div className="empty-state"><div className="empty-icon">🏛️</div><p className="empty-text">No verified properties yet.</p></div>
            )
          )}
        </div>
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