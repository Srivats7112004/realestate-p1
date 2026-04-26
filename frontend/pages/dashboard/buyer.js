// frontend/pages/dashboard/buyer.js
import { useMemo, useState } from "react";
import { useWeb3 } from "../../context/Web3Context";
import Navbar from "../../components/Navbar";
import PropertyCard from "../../components/PropertyCard";
import KYCBadge from "../../components/KYCBadge";
import { isZeroAddress } from "../../utils/helpers";

function StatCard({ label, value, subtext, color = "text-slate-900" }) {
  return (
    <div className="soft-stat p-5">
      <div className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
        {label}
      </div>
      <div className={`text-3xl font-bold tracking-tight ${color}`}>{value}</div>
      <p className="mt-2 text-sm text-slate-500">{subtext}</p>
    </div>
  );
}

export default function BuyerDashboard() {
  const { account, provider, escrow, properties, loadBlockchainData } = useWeb3();
  const [processingId, setProcessingId] = useState(null);
  const [activeTab, setActiveTab] = useState("available");

  const myPurchases = useMemo(() => {
    return properties.filter(
      (p) =>
        p.buyer &&
        account &&
        !isZeroAddress(p.buyer) &&
        p.buyer.toLowerCase() === account.toLowerCase()
    );
  }, [properties, account]);

  const availableProperties = useMemo(() => {
    return properties.filter(
      (p) =>
        isZeroAddress(p.buyer) &&
        (!p.seller || p.seller.toLowerCase() !== account?.toLowerCase())
    );
  }, [properties, account]);

  const totalInvested = useMemo(() => {
    return myPurchases.reduce((sum, p) => sum + parseFloat(p.price || 0), 0);
  }, [myPurchases]);

  const purchasedCount = myPurchases.length;
  const availableCount = availableProperties.length;
  const soldToMeCount = myPurchases.filter((p) => p.sold).length;

  const handleAction = async (action, property) => {
    if (action !== "buy") return;
    setProcessingId(property.id);

    try {
      const signer = provider.getSigner();
      const tx = await escrow
        .connect(signer)
        .depositEarnest(property.id, { value: property.purchasePrice });

      await tx.wait();
      alert("Payment deposited successfully!");
      loadBlockchainData();
    } catch (error) {
      console.error("Action failed:", error);
      alert(error?.reason || error?.message || "Action failed.");
    } finally {
      setProcessingId(null);
    }
  };

  const tabs = [
    {
      key: "available",
      label: "Available Properties",
      count: availableCount,
    },
    {
      key: "mine",
      label: "My Purchases",
      count: purchasedCount,
    },
  ];

  return (
    <div className="app-shell min-h-screen">
      <Navbar />

      <main className="app-container py-8 md:py-10">
        {/* Hero */}
        <section className="animate-fadeIn">
          <div className="hero-panel overflow-hidden px-6 py-8 md:px-10 md:py-10">
            <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
              <div>
                <div className="page-kicker mb-5">
                  <span className="page-dot" />
                  Buyer workspace
                </div>

                <h1 className="mb-4 text-4xl font-bold tracking-tight text-slate-900 md:text-5xl">
                  Discover, track, and secure high-quality on-chain property purchases
                </h1>

                <p className="section-subtext max-w-2xl text-base md:text-lg">
                  Browse available listings, monitor your acquisition pipeline, and
                  keep a clean view of the properties you have already entered into escrow.
                </p>

                <div className="mt-7 flex flex-wrap gap-3">
                  <div className="ghost-chip px-4 py-2 text-sm font-medium">
                    Buyer dashboard
                  </div>
                  <div className="ghost-chip px-4 py-2 text-sm font-medium">
                    Escrow deposits
                  </div>
                  <div className="ghost-chip px-4 py-2 text-sm font-medium">
                    Portfolio tracking
                  </div>
                </div>
              </div>

              <div>
                <div className="surface-card-strong p-5 md:p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <div className="text-sm font-semibold text-slate-800">
                        Buyer Snapshot
                      </div>
                      <div className="text-xs text-slate-500">
                        Current portfolio and availability summary
                      </div>
                    </div>
                    <KYCBadge address={account} showRequestButton={true} />
                  </div>

                  <div className="space-y-4">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                      <div className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-400">
                        Purchased Properties
                      </div>
                      <div className="text-2xl font-bold text-emerald-600">
                        {purchasedCount}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                      <div className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-400">
                        Available Listings
                      </div>
                      <div className="text-2xl font-bold text-sky-600">
                        {availableCount}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                      <div className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-400">
                        Total Invested
                      </div>
                      <div className="text-2xl font-bold text-violet-600">
                        {totalInvested.toFixed(2)} ETH
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="pt-8">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="My Purchases"
              value={purchasedCount}
              subtext="Properties where your wallet is already recorded as buyer."
              color="text-emerald-600"
            />

            <StatCard
              label="Available Listings"
              value={availableCount}
              subtext="Properties still open for buyer-side escrow deposit."
              color="text-sky-600"
            />

            <StatCard
              label="Total Invested"
              value={`${totalInvested.toFixed(2)} ETH`}
              subtext="Combined value of your currently tracked purchase entries."
              color="text-violet-600"
            />

            <StatCard
              label="Completed Transfers"
              value={soldToMeCount}
              subtext="Properties that have been fully finalized and sold."
              color="text-slate-900"
            />
          </div>
        </section>

        {/* Tabs */}
        <section className="pt-10">
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="page-kicker mb-3">
                <span className="page-dot" />
                Buyer views
              </div>
              <h2 className="section-heading">Switch between discovery and portfolio tracking</h2>
              <p className="section-subtext mt-2 max-w-2xl">
                Explore new properties or review the assets already tied to your buyer wallet.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Current view
              </div>
              <div className="text-2xl font-bold text-slate-900">
                {activeTab === "available" ? "Discovery" : "Portfolio"}
              </div>
            </div>
          </div>

          <div className="surface-card p-4 md:p-5">
            <div className="flex flex-wrap gap-3">
              {tabs.map((tab) => {
                const active = activeTab === tab.key;

                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                      active
                        ? "border-sky-200 bg-sky-50 text-sky-700 shadow-sm"
                        : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    {tab.label} ({tab.count})
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* Available properties */}
        {activeTab === "available" && (
          <section className="pt-8 animate-fadeIn">
            <div className="mb-6 flex items-end justify-between gap-4">
              <div>
                <h3 className="section-heading">Available properties</h3>
                <p className="section-subtext mt-2">
                  Listings you can currently enter by depositing earnest money into escrow.
                </p>
              </div>

              <div className="hidden rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm md:block">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Results
                </div>
                <div className="text-xl font-bold text-slate-900">{availableCount}</div>
              </div>
            </div>

            <div className="grid-divider mb-6" />

            {availableProperties.length > 0 ? (
              <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
                {availableProperties.map((property) => (
                  <div
                    key={property.id}
                    className={processingId === property.id ? "opacity-80" : ""}
                  >
                    <PropertyCard property={property} onAction={handleAction} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="surface-card-strong px-6 py-20 text-center">
                <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-sky-50 text-4xl">
                  🏘️
                </div>

                <h3 className="text-2xl font-bold tracking-tight text-slate-900">
                  No properties available right now
                </h3>

                <p className="mx-auto mt-3 max-w-xl text-slate-500">
                  There are currently no listings open for purchase. Check back later
                  as new properties are added to the marketplace.
                </p>
              </div>
            )}
          </section>
        )}

        {/* My purchases */}
        {activeTab === "mine" && (
          <section className="pt-8 animate-fadeIn">
            <div className="mb-6 flex items-end justify-between gap-4">
              <div>
                <h3 className="section-heading">My purchased properties</h3>
                <p className="section-subtext mt-2">
                  Properties already associated with your wallet as buyer.
                </p>
              </div>

              <div className="hidden rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm md:block">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Results
                </div>
                <div className="text-xl font-bold text-slate-900">{purchasedCount}</div>
              </div>
            </div>

            <div className="grid-divider mb-6" />

            {myPurchases.length > 0 ? (
              <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
                {myPurchases.map((property) => (
                  <PropertyCard
                    key={property.id}
                    property={property}
                    onAction={handleAction}
                  />
                ))}
              </div>
            ) : (
              <div className="surface-card-strong px-6 py-20 text-center">
                <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-violet-50 text-4xl">
                  📦
                </div>

                <h3 className="text-2xl font-bold tracking-tight text-slate-900">
                  You haven&apos;t purchased any properties yet
                </h3>

                <p className="mx-auto mt-3 max-w-xl text-slate-500">
                  Start with the available listings view to discover properties and
                  deposit earnest money into escrow.
                </p>

                <button
                  onClick={() => setActiveTab("available")}
                  className="primary-btn mt-6 px-6 py-3 text-sm"
                >
                  Explore available listings
                </button>
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}