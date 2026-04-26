// frontend/pages/index.js
import { useState, useEffect, useMemo } from "react";
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

  useEffect(() => {
    if (!loading && !account) {
      router.push("/landing");
    }
  }, [account, loading, router]);

  useEffect(() => {
    setFilteredProperties(properties);
  }, [properties]);

  const stats = useMemo(() => {
    const total = properties.length;
    const verified = properties.filter((p) => p.governmentVerified).length;
    const inEscrow = properties.filter((p) => p.buyerDeposited).length;
    const sold = properties.filter((p) => p.sold).length;

    return { total, verified, inEscrow, sold };
  }, [properties]);

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
          const tx = await escrow.connect(signer).approveSale(property.id);
          await tx.wait();
          alert("Lender approved!");
          break;
        }

        case "verify": {
          const tx = await escrow.connect(signer).verifyProperty(property.id);
          await tx.wait();
          alert("Government verification complete!");
          break;
        }

        case "sell": {
          let tx = await escrow.connect(signer).approveSale(property.id);
          await tx.wait();

          tx = await escrow.connect(signer).finalizeSale(property.id);
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
    <div className="app-shell">
      <Navbar />

      <main className="app-container pb-16">
        {/* Hero / Intro */}
        <section className="pt-8 md:pt-10">
          <div className="hero-panel overflow-hidden px-6 py-8 md:px-10 md:py-10">
            <div className="grid items-center gap-10 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="animate-fadeIn">
                <div className="page-kicker mb-5">
                  <span className="page-dot" />
                  Live blockchain marketplace dashboard
                </div>

                <h1 className="mb-4 max-w-3xl text-4xl font-bold tracking-tight text-slate-900 md:text-5xl">
                  Manage listings, approvals, and escrow progress from one clean workspace
                </h1>

                <p className="section-subtext max-w-2xl text-base md:text-lg">
                  Browse tokenized properties, monitor real-time sale progress,
                  and complete escrow-driven transactions with full workflow visibility.
                </p>

                <div className="mt-7 flex flex-wrap gap-3">
                  {account && userRole === "user" && (
                    <button
                      onClick={() => setShowListForm(!showListForm)}
                      className="primary-btn px-6 py-3 text-sm md:text-base"
                    >
                      {showListForm ? "Close listing form" : "List New Property"}
                    </button>
                  )}

                  <button
                    onClick={() => router.push("/marketplace")}
                    className="secondary-btn px-6 py-3 text-sm md:text-base"
                  >
                    Browse Marketplace
                  </button>
                </div>
              </div>

              <div className="animate-fadeIn">
                <div className="surface-card-strong p-5 md:p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <div className="text-sm font-semibold text-slate-800">
                        Transaction Snapshot
                      </div>
                      <div className="text-xs text-slate-500">
                        Current marketplace activity
                      </div>
                    </div>

                    <div className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
                      Live
                    </div>
                  </div>

                  <div className="space-y-4">
                    {[
                      {
                        label: "Properties listed",
                        value: stats.total,
                        color: "text-slate-900",
                      },
                      {
                        label: "Verified assets",
                        value: stats.verified,
                        color: "text-emerald-600",
                      },
                      {
                        label: "Escrow active",
                        value: stats.inEscrow,
                        color: "text-sky-600",
                      },
                      {
                        label: "Completed transfers",
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

        {/* List form */}
        {account && userRole === "user" && showListForm && (
          <section className="pt-8 animate-fadeIn">
            <div className="surface-card-strong p-6 md:p-8">
              <div className="mb-6">
                <div className="page-kicker mb-3">
                  <span className="page-dot" />
                  Seller action
                </div>
                <h2 className="section-heading">Create a new property listing</h2>
                <p className="section-subtext mt-2 max-w-2xl">
                  Upload property information, connect the asset to the escrow workflow,
                  and publish it to the marketplace with a cleaner, investor-ready presentation.
                </p>
              </div>

              <ListPropertyForm
                onSuccess={() => {
                  setShowListForm(false);
                  loadBlockchainData();
                }}
              />
            </div>
          </section>
        )}

        {/* Stats row */}
        <section className="pt-8">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="soft-stat p-5">
              <div className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                Total Listings
              </div>
              <div className="text-3xl font-bold tracking-tight text-slate-900">
                {stats.total}
              </div>
              <p className="mt-2 text-sm text-slate-500">
                All properties currently available in the ecosystem.
              </p>
            </div>

            <div className="soft-stat p-5">
              <div className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                Government Verified
              </div>
              <div className="text-3xl font-bold tracking-tight text-emerald-600">
                {stats.verified}
              </div>
              <p className="mt-2 text-sm text-slate-500">
                Assets that completed the verification milestone.
              </p>
            </div>

            <div className="soft-stat p-5">
              <div className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                Escrow Active
              </div>
              <div className="text-3xl font-bold tracking-tight text-sky-600">
                {stats.inEscrow}
              </div>
              <p className="mt-2 text-sm text-slate-500">
                Transactions with buyer funds already deposited.
              </p>
            </div>

            <div className="soft-stat p-5">
              <div className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                Completed Sales
              </div>
              <div className="text-3xl font-bold tracking-tight text-violet-600">
                {stats.sold}
              </div>
              <p className="mt-2 text-sm text-slate-500">
                Fully finalized property transfers on-chain.
              </p>
            </div>
          </div>
        </section>

        {/* Filter / catalog header */}
        <section className="pt-10">
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="page-kicker mb-3">
                <span className="page-dot" />
                Property catalog
              </div>
              <h2 className="section-heading">
                Discover and act on live marketplace listings
              </h2>
              <p className="section-subtext mt-2 max-w-2xl">
                Review the latest properties, check workflow readiness, and move
                transactions forward with role-based actions.
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

          {properties.length > 0 ? (
            <div className="surface-card p-4 md:p-5 mb-6">
              <PropertyFilter
                properties={properties}
                onFilter={setFilteredProperties}
              />
            </div>
          ) : null}
        </section>

        {/* Listing grid */}
        <section>
          {loading ? (
            <div className="surface-card-strong py-20 text-center">
              <div className="mx-auto mb-4 h-12 w-12 rounded-full border-4 border-sky-500 border-t-transparent animate-spin" />
              <h3 className="text-xl font-semibold text-slate-800">
                Loading marketplace data
              </h3>
              <p className="mt-2 text-slate-500">
                Syncing listings and workflow states from the blockchain.
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
                🏘️
              </div>

              <h3 className="text-2xl font-bold tracking-tight text-slate-900">
                No properties found
              </h3>

              <p className="mx-auto mt-3 max-w-xl text-slate-500">
                {properties.length === 0
                  ? "No assets have been listed yet. Start by creating the first property listing and publish it to the marketplace."
                  : "No listings match the current filter settings. Adjust your filters to explore more properties."}
              </p>

              {account && userRole === "user" && properties.length === 0 && (
                <button
                  onClick={() => setShowListForm(true)}
                  className="primary-btn mt-6 px-6 py-3 text-sm"
                >
                  Create first listing
                </button>
              )}
            </div>
          )}
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white/85 backdrop-blur-sm">
        <div className="app-container py-8">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-800">
                BlockEstate
              </p>
              <p className="text-sm text-slate-500">
                Blockchain-powered real estate workflow with escrow, approvals, and NFT ownership.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <span className="ghost-chip px-3 py-1.5 text-xs font-medium">
                Solidity
              </span>
              <span className="ghost-chip px-3 py-1.5 text-xs font-medium">
                Hardhat
              </span>
              <span className="ghost-chip px-3 py-1.5 text-xs font-medium">
                Next.js
              </span>
              <span className="ghost-chip px-3 py-1.5 text-xs font-medium">
                Ethers.js
              </span>
              <span className="ghost-chip px-3 py-1.5 text-xs font-medium">
                IPFS
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}