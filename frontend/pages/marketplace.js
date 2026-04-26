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
      if (filter === "sold") return property.sold;
      if (filter === "active") return !property.sold;
      return true;
    });
  }, [properties, filter]);

  const stats = useMemo(() => {
    return {
      total: properties.length,
      verified: properties.filter((p) => p.governmentVerified).length,
      pending: properties.filter((p) => !p.governmentVerified).length,
      sold: properties.filter((p) => p.sold).length,
    };
  }, [properties]);

  const filterTabs = [
    { key: "all", label: "All Properties" },
    { key: "verified", label: "Verified" },
    { key: "pending", label: "Pending" },
    { key: "active", label: "Active" },
    { key: "sold", label: "Sold" },
  ];

  return (
    <div className="app-shell">
      <Navbar />

      <main className="app-container pb-16">
        {/* Hero */}
        <section className="pt-8 md:pt-10">
          <div className="hero-panel overflow-hidden px-6 py-8 md:px-10 md:py-10">
            <div className="grid items-center gap-10 lg:grid-cols-[1.15fr_0.85fr]">
              <div className="animate-fadeIn">
                <div className="page-kicker mb-5">
                  <span className="page-dot" />
                  Marketplace overview
                </div>

                <h1 className="mb-4 max-w-3xl text-4xl font-bold tracking-tight text-slate-900 md:text-5xl">
                  Browse premium on-chain property listings with full sale visibility
                </h1>

                <p className="section-subtext max-w-2xl text-base md:text-lg">
                  Review verified properties, track approval milestones, and move
                  transactions through escrow with a cleaner and more professional marketplace experience.
                </p>

                <div className="mt-7 flex flex-wrap gap-3">
                  <div className="ghost-chip px-4 py-2 text-sm font-medium">
                    NFT-backed ownership
                  </div>
                  <div className="ghost-chip px-4 py-2 text-sm font-medium">
                    Escrow workflow
                  </div>
                  <div className="ghost-chip px-4 py-2 text-sm font-medium">
                    Role-based approvals
                  </div>
                </div>
              </div>

              <div className="animate-fadeIn">
                <div className="surface-card-strong p-5 md:p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <div className="text-sm font-semibold text-slate-800">
                        Portfolio Snapshot
                      </div>
                      <div className="text-xs text-slate-500">
                        Marketplace status at a glance
                      </div>
                    </div>

                    <div className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
                      Updated live
                    </div>
                  </div>

                  <div className="space-y-4">
                    {[
                      {
                        label: "Total properties",
                        value: stats.total,
                        color: "text-slate-900",
                      },
                      {
                        label: "Verified properties",
                        value: stats.verified,
                        color: "text-emerald-600",
                      },
                      {
                        label: "Pending verification",
                        value: stats.pending,
                        color: "text-amber-600",
                      },
                      {
                        label: "Sold properties",
                        value: stats.sold,
                        color: "text-violet-600",
                      },
                    ].map((item) => (
                      <div
                        key={item.label}
                        className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
                      >
                        <div className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-400">
                          {item.label}
                        </div>
                        <div className={`text-2xl font-bold ${item.color}`}>
                          {item.value}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="pt-8">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="soft-stat p-5">
              <div className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                Total Assets
              </div>
              <div className="text-3xl font-bold tracking-tight text-slate-900">
                {stats.total}
              </div>
              <p className="mt-2 text-sm text-slate-500">
                All properties currently visible in the marketplace.
              </p>
            </div>

            <div className="soft-stat p-5">
              <div className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                Verified Inventory
              </div>
              <div className="text-3xl font-bold tracking-tight text-emerald-600">
                {stats.verified}
              </div>
              <p className="mt-2 text-sm text-slate-500">
                Properties cleared by government verification.
              </p>
            </div>

            <div className="soft-stat p-5">
              <div className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                Pending Review
              </div>
              <div className="text-3xl font-bold tracking-tight text-amber-600">
                {stats.pending}
              </div>
              <p className="mt-2 text-sm text-slate-500">
                Listings that still require verification progress.
              </p>
            </div>

            <div className="soft-stat p-5">
              <div className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                Completed Transfers
              </div>
              <div className="text-3xl font-bold tracking-tight text-violet-600">
                {stats.sold}
              </div>
              <p className="mt-2 text-sm text-slate-500">
                Properties fully finalized and transferred on-chain.
              </p>
            </div>
          </div>
        </section>

        {/* Filters */}
        <section className="pt-10">
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="page-kicker mb-3">
                <span className="page-dot" />
                Smart filtering
              </div>
              <h2 className="section-heading">Refine listings by status</h2>
              <p className="section-subtext mt-2 max-w-2xl">
                Narrow down the marketplace to verified, pending, sold, or active properties
                and focus on the listings that matter most.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Visible results
              </div>
              <div className="text-2xl font-bold text-slate-900">
                {filteredProperties.length}
              </div>
            </div>
          </div>

          <div className="grid-divider mb-6" />

          <div className="surface-card p-4 md:p-5">
            <div className="flex flex-wrap gap-3">
              {filterTabs.map((tab) => {
                const active = filter === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setFilter(tab.key)}
                    className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                      active
                        ? "border-sky-200 bg-sky-50 text-sky-700 shadow-sm"
                        : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* Grid */}
        <section className="pt-8">
          {loading ? (
            <div className="surface-card-strong py-20 text-center">
              <div className="mx-auto mb-4 h-12 w-12 rounded-full border-4 border-sky-500 border-t-transparent animate-spin" />
              <h3 className="text-xl font-semibold text-slate-800">
                Loading marketplace
              </h3>
              <p className="mt-2 text-slate-500">
                Fetching property listings and on-chain workflow states.
              </p>
            </div>
          ) : filteredProperties.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
              {filteredProperties.map((property) => (
                <PropertyCard
                  key={property.id}
                  property={property}
                  onAction={handleAction}
                />
              ))}
            </div>
          ) : (
            <div className="surface-card-strong px-6 py-20 text-center">
              <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-sky-50 text-4xl">
                🏠
              </div>

              <h3 className="text-2xl font-bold tracking-tight text-slate-900">
                No properties found
              </h3>

              <p className="mx-auto mt-3 max-w-xl text-slate-500">
                No listings match the selected filter right now. Switch filters to explore
                more properties across the marketplace.
              </p>

              <button
                onClick={() => setFilter("all")}
                className="primary-btn mt-6 px-6 py-3 text-sm"
              >
                Show all properties
              </button>
            </div>
          )}
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white/85 backdrop-blur-sm">
        <div className="app-container py-8">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-800">
                BlockEstate Marketplace
              </p>
              <p className="text-sm text-slate-500">
                Professional property discovery with escrow-backed blockchain workflows.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <span className="ghost-chip px-3 py-1.5 text-xs font-medium">
                Verified listings
              </span>
              <span className="ghost-chip px-3 py-1.5 text-xs font-medium">
                Role approvals
              </span>
              <span className="ghost-chip px-3 py-1.5 text-xs font-medium">
                On-chain transfer
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}