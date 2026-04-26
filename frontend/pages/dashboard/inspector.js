// frontend/pages/dashboard/inspector.js
import { useState } from "react";
import { useWeb3 } from "../../context/Web3Context";
import Navbar from "../../components/Navbar";
import PropertyCard from "../../components/PropertyCard";
import AIInspectionPanel from "../../components/AIInspectionPanel";
import AuthGuard from "../../components/AuthGuard";

function InspectorDashboardInner() {
  const { provider, escrow, properties, loadBlockchainData, runAIInspection, canUseRoleWallet, requiredRoleWallet } = useWeb3();
  const [aiReports, setAiReports] = useState({});
  const [aiErrors, setAiErrors] = useState({});
  const [activeAIPropertyId, setActiveAIPropertyId] = useState(null);
  const [activeTab, setActiveTab] = useState("pending");

  const pending = properties.filter((p) => !p.inspectionPassed && !p.sold);
  const passed = properties.filter((p) => p.inspectionPassed || p.sold);

  const handleAction = async (action, property) => {
    if (action !== "inspect") return;
    if (!provider || !escrow) return alert("Wallet or contract not ready.");
    if (!canUseRoleWallet) return alert(requiredRoleWallet ? `Inspector wallet required:\n${requiredRoleWallet}` : "Cannot perform this action with current wallet.");
    try {
      const signer = provider.getSigner();
      const tx = await escrow.connect(signer).updateInspectionStatus(property.id, true);
      await tx.wait();
      alert("✅ Inspection approved!");
      await loadBlockchainData();
    } catch (error) {
      alert(error?.reason || error?.message || "Inspection failed.");
    }
  };

  const handleAIRun = async (property) => {
    setActiveAIPropertyId(property.id);
    setAiErrors((prev) => ({ ...prev, [property.id]: "" }));
    try {
      const report = await runAIInspection(property);
      setAiReports((prev) => ({ ...prev, [property.id]: report }));
    } catch (error) {
      setAiErrors((prev) => ({ ...prev, [property.id]: error.message || "AI inspection failed." }));
    } finally {
      setActiveAIPropertyId(null);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0d0e12", fontFamily: "'DM Sans', 'Segoe UI', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; }
        .insp-bg { background: #0d0e12; position: relative; min-height: 100vh; }
        .insp-bg::before { content: ''; position: fixed; top: 10%; left: -15%; width: 60vw; height: 60vw; background: radial-gradient(circle, rgba(251,146,60,0.06) 0%, transparent 70%); pointer-events: none; z-index: 0; }
        .page-content { position: relative; z-index: 1; max-width: 1400px; margin: 0 auto; padding: 2rem 1.5rem 4rem; }
        .page-title { font-size: 2rem; font-weight: 700; color: #f0eeee; letter-spacing: -0.03em; margin: 0 0 0.25rem; }
        .page-subtitle { font-size: 0.875rem; color: #5c5a6a; margin: 0 0 2rem; }
        .wallet-banner { border-radius: 14px; padding: 1rem 1.25rem; margin-bottom: 1.5rem; font-size: 0.85rem; font-weight: 500; border: 1px solid; }
        .wallet-banner.warn { background: rgba(251,146,60,0.08); border-color: rgba(251,146,60,0.25); color: #fb923c; }
        .wallet-banner.ok { background: rgba(52,211,153,0.07); border-color: rgba(52,211,153,0.2); color: #34d399; }
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap: 1rem; margin-bottom: 2.5rem; }
        .stat-card { background: rgba(255,255,255,0.025); border: 1px solid rgba(255,255,255,0.06); border-radius: 14px; padding: 1.25rem 1.5rem; }
        .stat-label { font-size: 0.72rem; color: #5c5a6a; text-transform: uppercase; letter-spacing: 0.09em; font-weight: 500; margin-bottom: 0.4rem; }
        .stat-value { font-size: 1.875rem; font-weight: 700; letter-spacing: -0.04em; }
        .stat-value.slate { color: #9ca3af; }
        .stat-value.orange { color: #fb923c; }
        .stat-value.green { color: #34d399; }
        .tabs-row { display: flex; gap: 0.25rem; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; padding: 0.25rem; max-width: 420px; margin-bottom: 2rem; }
        .tab-btn { flex: 1; padding: 0.6rem 1rem; border-radius: 9px; border: none; cursor: pointer; font-family: inherit; font-size: 0.85rem; font-weight: 500; transition: all 0.2s; background: transparent; color: #5c5a6a; }
        .tab-btn.active { background: rgba(251,146,60,0.15); color: #fb923c; border: 1px solid rgba(251,146,60,0.3); }
        .tab-btn:hover:not(.active) { color: #9ca3af; }
        .insp-grid { display: grid; gap: 1.5rem; }
        .insp-row { display: grid; grid-template-columns: 360px 1fr; gap: 1.25rem; align-items: start; }
        .props-grid { display: grid; gap: 1.25rem; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); }
        .empty-state { text-align: center; padding: 3rem 2rem; background: rgba(255,255,255,0.02); border: 1px dashed rgba(255,255,255,0.07); border-radius: 18px; }
        .empty-icon { font-size: 2rem; margin-bottom: 0.75rem; }
        .empty-text { color: #5c5a6a; font-size: 0.875rem; }
        @media (max-width: 900px) { .insp-row { grid-template-columns: 1fr; } .page-title { font-size: 1.5rem; } }
        @media (max-width: 640px) { .stats-grid { grid-template-columns: 1fr 1fr; } .props-grid { grid-template-columns: 1fr; } }
      `}</style>

      <Navbar />

      <div className="insp-bg">
        <div className="page-content">
          <h1 className="page-title">🔍 Inspector Dashboard</h1>
          <p className="page-subtitle">Run AI-assisted checks and approve inspections on-chain</p>

          <div className={`wallet-banner ${canUseRoleWallet ? "ok" : "warn"}`}>
            {canUseRoleWallet
              ? "✅ Connected wallet is authorised for inspector on-chain actions."
              : <>⚠️ App role is <strong>inspector</strong> but the smart contract requires the configured inspector wallet.{requiredRoleWallet && <><br />Required: <code style={{fontFamily:"'DM Mono',monospace"}}>{requiredRoleWallet}</code></>}</>
            }
          </div>

          <div className="stats-grid">
            <div className="stat-card"><div className="stat-label">Total</div><div className="stat-value slate">{properties.length}</div></div>
            <div className="stat-card"><div className="stat-label">Pending</div><div className="stat-value orange">{pending.length}</div></div>
            <div className="stat-card"><div className="stat-label">Passed</div><div className="stat-value green">{passed.length}</div></div>
          </div>

          <div className="tabs-row">
            <button className={`tab-btn ${activeTab === "pending" ? "active" : ""}`} onClick={() => setActiveTab("pending")}>⏳ Pending ({pending.length})</button>
            <button className={`tab-btn ${activeTab === "passed" ? "active" : ""}`} onClick={() => setActiveTab("passed")}>✅ Passed ({passed.length})</button>
          </div>

          {activeTab === "pending" && (
            pending.length > 0 ? (
              <div className="insp-grid">
                {pending.map((property) => (
                  <div key={property.id} className="insp-row">
                    <PropertyCard property={property} onAction={handleAction} />
                    <AIInspectionPanel property={property} report={aiReports[property.id]} error={aiErrors[property.id]} loading={activeAIPropertyId === property.id} onRun={handleAIRun} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state"><div className="empty-icon">✅</div><p className="empty-text">All inspections complete!</p></div>
            )
          )}

          {activeTab === "passed" && (
            passed.length > 0 ? (
              <div className="props-grid">
                {passed.map((p) => <PropertyCard key={p.id} property={p} onAction={handleAction} />)}
              </div>
            ) : (
              <div className="empty-state"><div className="empty-icon">🔍</div><p className="empty-text">No inspected properties yet.</p></div>
            )
          )}
        </div>
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