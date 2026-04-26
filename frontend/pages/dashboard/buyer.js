// frontend/pages/dashboard/buyer.js
import { useState } from "react";
import { useWeb3 } from "../../context/Web3Context";
import Navbar from "../../components/Navbar";
import PropertyCard from "../../components/PropertyCard";
import KYCBadge from "../../components/KYCBadge";
import { isZeroAddress } from "../../utils/helpers";

export default function BuyerDashboard() {
  const { account, provider, escrow, properties, loadBlockchainData } = useWeb3();
  const [processingId, setProcessingId] = useState(null);
  const [activeTab, setActiveTab] = useState("available");

  const myPurchases = properties.filter(
    (p) => p.buyer && account && !isZeroAddress(p.buyer) && p.buyer.toLowerCase() === account.toLowerCase()
  );
  const availableProperties = properties.filter(
    (p) => isZeroAddress(p.buyer) && (!p.seller || p.seller.toLowerCase() !== account?.toLowerCase())
  );
  const totalInvested = myPurchases.reduce((sum, p) => sum + parseFloat(p.price || 0), 0);

  const handleAction = async (action, property) => {
    if (action !== "buy") return;
    setProcessingId(property.id);
    try {
      const signer = provider.getSigner();
      const tx = await escrow.connect(signer).depositEarnest(property.id, { value: property.purchasePrice });
      await tx.wait();
      alert("💰 Payment deposited successfully!");
      loadBlockchainData();
    } catch (error) {
      console.error("Action failed:", error);
      alert(error?.reason || error?.message || "Action failed.");
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0c0f1a", fontFamily: "'DM Sans', 'Segoe UI', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; }
        .buyer-bg { background: #0c0f1a; position: relative; min-height: 100vh; }
        .buyer-bg::before { content: ''; position: fixed; top: -20%; right: -5%; width: 55vw; height: 55vw; background: radial-gradient(circle, rgba(99,102,241,0.07) 0%, transparent 70%); pointer-events: none; z-index: 0; }
        .buyer-bg::after { content: ''; position: fixed; bottom: 0; left: -10%; width: 40vw; height: 40vw; background: radial-gradient(circle, rgba(52,211,153,0.05) 0%, transparent 70%); pointer-events: none; z-index: 0; }
        .page-content { position: relative; z-index: 1; max-width: 1280px; margin: 0 auto; padding: 2rem 1.5rem 4rem; }
        .page-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 2.5rem; gap: 1rem; flex-wrap: wrap; }
        .page-title { font-size: 2rem; font-weight: 700; color: #eef0ff; letter-spacing: -0.03em; margin: 0 0 0.25rem; }
        .page-subtitle { font-size: 0.875rem; color: #5a6080; margin: 0; }
        .accent-bar { display: inline-block; width: 4px; height: 1.8rem; background: linear-gradient(180deg, #6366f1, #34d399); border-radius: 2px; margin-right: 0.75rem; vertical-align: middle; }
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1rem; margin-bottom: 2.5rem; }
        .stat-card { background: rgba(255,255,255,0.025); border: 1px solid rgba(255,255,255,0.06); border-radius: 16px; padding: 1.5rem; transition: all 0.2s; }
        .stat-card:hover { background: rgba(255,255,255,0.04); border-color: rgba(99,102,241,0.25); transform: translateY(-1px); }
        .stat-label { font-size: 0.72rem; color: #5a6080; text-transform: uppercase; letter-spacing: 0.09em; font-weight: 500; margin-bottom: 0.5rem; }
        .stat-value { font-size: 1.875rem; font-weight: 700; letter-spacing: -0.04em; line-height: 1; }
        .stat-value.indigo { color: #818cf8; }
        .stat-value.green { color: #34d399; }
        .stat-value.purple { color: #c084fc; }
        .tabs-row { display: flex; gap: 0.25rem; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; padding: 0.25rem; max-width: 480px; margin-bottom: 2rem; }
        .tab-btn { flex: 1; padding: 0.6rem 1rem; border-radius: 9px; border: none; cursor: pointer; font-family: inherit; font-size: 0.85rem; font-weight: 500; transition: all 0.2s; background: transparent; color: #5a6080; }
        .tab-btn.active { background: rgba(99,102,241,0.2); color: #818cf8; border: 1px solid rgba(99,102,241,0.3); }
        .tab-btn:hover:not(.active) { color: #8b90b0; }
        .section-header { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1.25rem; }
        .section-title { font-size: 0.95rem; font-weight: 600; color: #cdd0f0; }
        .section-count { font-size: 0.72rem; background: rgba(255,255,255,0.05); color: #6b6e90; border-radius: 20px; padding: 0.18rem 0.55rem; font-family: 'DM Mono', monospace; }
        .section-line { flex: 1; height: 1px; background: rgba(255,255,255,0.05); }
        .property-grid { display: grid; gap: 1.25rem; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); }
        .empty-state { text-align: center; padding: 3.5rem 2rem; background: rgba(255,255,255,0.02); border: 1px dashed rgba(255,255,255,0.07); border-radius: 20px; }
        .empty-icon { font-size: 2.5rem; margin-bottom: 0.75rem; }
        .empty-text { color: #5a6080; font-size: 0.875rem; line-height: 1.6; }
        @media (max-width: 640px) { .page-title { font-size: 1.5rem; } .stats-grid { grid-template-columns: 1fr 1fr; } .property-grid { grid-template-columns: 1fr; } }
      `}</style>

      <Navbar />

      <div className="buyer-bg">
        <div className="page-content">
          <div className="page-header">
            <div>
              <h1 className="page-title"><span className="accent-bar" />Buyer Dashboard</h1>
              <p className="page-subtitle">Discover and purchase tokenised real estate</p>
            </div>
            <KYCBadge address={account} showRequestButton={true} />
          </div>

          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-label">My Purchases</div>
              <div className="stat-value green">{myPurchases.length}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Available</div>
              <div className="stat-value indigo">{availableProperties.length}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Total Invested</div>
              <div className="stat-value purple">{totalInvested.toFixed(2)} <span style={{fontSize:"0.9rem",opacity:0.6}}>ETH</span></div>
            </div>
          </div>

          <div className="tabs-row">
            <button className={`tab-btn ${activeTab === "available" ? "active" : ""}`} onClick={() => setActiveTab("available")}>
              🏘 Available ({availableProperties.length})
            </button>
            <button className={`tab-btn ${activeTab === "mine" ? "active" : ""}`} onClick={() => setActiveTab("mine")}>
              📦 My Purchases ({myPurchases.length})
            </button>
          </div>

          {activeTab === "available" && (
            <>
              <div className="section-header">
                <span className="section-title">Available Properties</span>
                <span className="section-count">{availableProperties.length}</span>
                <div className="section-line" />
              </div>
              {availableProperties.length > 0 ? (
                <div className="property-grid">
                  {availableProperties.map((p) => <PropertyCard key={p.id} property={p} onAction={handleAction} />)}
                </div>
              ) : (
                <div className="empty-state">
                  <div className="empty-icon">🏘</div>
                  <p className="empty-text">No properties available right now.<br />Check back soon.</p>
                </div>
              )}
            </>
          )}

          {activeTab === "mine" && (
            <>
              <div className="section-header">
                <span className="section-title">My Purchased Properties</span>
                <span className="section-count">{myPurchases.length}</span>
                <div className="section-line" />
              </div>
              {myPurchases.length > 0 ? (
                <div className="property-grid">
                  {myPurchases.map((p) => <PropertyCard key={p.id} property={p} onAction={handleAction} />)}
                </div>
              ) : (
                <div className="empty-state">
                  <div className="empty-icon">📦</div>
                  <p className="empty-text">You haven&apos;t purchased any properties yet.</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}