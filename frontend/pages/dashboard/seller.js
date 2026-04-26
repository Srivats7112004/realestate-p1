import { useMemo, useState } from "react";
import { useWeb3 } from "../../context/Web3Context";
import Navbar from "../../components/Navbar";
import ListPropertyForm from "../../components/ListPropertyForm";
import PropertyCard from "../../components/PropertyCard";
import KYCBadge from "../../components/KYCBadge";

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

export default function SellerDashboard() {
  const { account, provider, escrow, properties, loadBlockchainData } = useWeb3();
  const [processingId, setProcessingId] = useState(null);
  const [statusMsg, setStatusMsg] = useState("");

  const myListings = useMemo(() => {
    return properties.filter(
      (p) =>
        p.seller &&
        account &&
        p.seller.toLowerCase() === account.toLowerCase()
    );
  }, [properties, account]);

  const totalValue = useMemo(() => {
    return myListings.reduce((sum, p) => sum + parseFloat(p.price || 0), 0);
  }, [myListings]);

  const pendingSales = useMemo(() => {
    return myListings.filter((p) => p.buyerDeposited && !p.sold);
  }, [myListings]);

  const completedSales = useMemo(() => {
    return myListings.filter((p) => p.sold);
  }, [myListings]);

  const liveListings = useMemo(() => {
    return myListings.filter((p) => !p.sold);
  }, [myListings]);

  const handleAction = async (action, property) => {
    if (action !== "sell") return;

    setProcessingId(property.id);
    setStatusMsg("");

    try {
      const signer = provider.getSigner();

      setStatusMsg(`Step 1/2 — Recording seller approval for Property #${property.id}...`);
      const approveTx = await escrow.connect(signer).approveSale(property.id);
      await approveTx.wait();

      await loadBlockchainData(false);

      setStatusMsg(`Step 2/2 — Finalizing sale for Property #${property.id}...`);
      const finalizeTx = await escrow.connect(signer).finalizeSale(property.id);
      await finalizeTx.wait();

      setStatusMsg("");
      alert("Sale finalized successfully!");
      await loadBlockchainData(false);
    } catch (error) {
      console.error("Seller action failed:", error);
      setStatusMsg("");
      alert(error?.reason || error?.message || "Seller action failed.");
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="app-shell min-h-screen">
      <Navbar />

      <main className="app-container py-8 md:py-10">
        {/* Hero */}
        <section className="animate-fadeIn">
          <div className="hero-panel overflow-hidden px-6 py-8 md:px-10 md:py-10">
            <div className="grid items-center gap-10 lg:grid-cols-[1.08fr_0.92fr]">
              <div>
                <div className="page-kicker mb-5">
                  <span className="page-dot" />
                  Seller workspace
                </div>

                <h1 className="mb-4 text-4xl font-bold tracking-tight text-slate-900 md:text-5xl">
                  List, manage, and finalize property sales from one clean dashboard
                </h1>

                <p className="section-subtext max-w-2xl text-base md:text-lg">
                  Publish new properties, track escrow workflow progress, and finalize
                  eligible sales with a more professional seller-side experience.
                </p>

                <div className="mt-7 flex flex-wrap gap-3">
                  <div className="ghost-chip px-4 py-2 text-sm font-medium">
                    Property listing
                  </div>
                  <div className="ghost-chip px-4 py-2 text-sm font-medium">
                    Escrow workflow
                  </div>
                  <div className="ghost-chip px-4 py-2 text-sm font-medium">
                    Seller finalization
                  </div>
                </div>
              </div>

              <div>
                <div className="surface-card-strong p-5 md:p-6">
                  <div className="mb-4 flex items-center justify-between gap-4">
                    <div>
                      <div className="text-sm font-semibold text-slate-800">
                        Seller Snapshot
                      </div>
                      <div className="text-xs text-slate-500">
                        Portfolio and sales overview
                      </div>
                    </div>

                    <KYCBadge address={account} showRequestButton={true} />
                  </div>

                  <div className="space-y-4">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                      <div className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-400">
                        Total Listings
                      </div>
                      <div className="text-2xl font-bold text-slate-900">
                        {myListings.length}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                      <div className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-400">
                        Live Listings
                      </div>
                      <div className="text-2xl font-bold text-sky-600">
                        {liveListings.length}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                      <div className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-400">
                        Total Value
                      </div>
                      <div className="text-2xl font-bold text-violet-600">
                        {totalValue.toFixed(2)} ETH
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Status banner */}
        {statusMsg ? (
          <section className="pt-6 animate-fadeIn">
            <div className="rounded-2xl border border-sky-200 bg-sky-50 px-5 py-4 text-sm text-sky-700">
              <div className="flex items-center gap-3">
                <div className="h-5 w-5 rounded-full border-2 border-sky-500 border-t-transparent animate-spin" />
                <div>
                  <div className="font-semibold">Processing seller action</div>
                  <div className="mt-1">{statusMsg}</div>
                </div>
              </div>
            </div>
          </section>
        ) : null}

        {/* Stats */}
        <section className="pt-8">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="My Listings"
              value={myListings.length}
              subtext="All properties currently listed by your connected seller wallet."
              color="text-slate-900"
            />

            <StatCard
              label="Live Listings"
              value={liveListings.length}
              subtext="Properties still active in the marketplace and not yet sold."
              color="text-sky-600"
            />

            <StatCard
              label="Pending Sales"
              value={pendingSales.length}
              subtext="Deals where buyer-side activity exists but sale is not finalized."
              color="text-amber-600"
            />

            <StatCard
              label="Completed Sales"
              value={completedSales.length}
              subtext="Properties fully finalized and transferred through escrow."
              color="text-emerald-600"
            />
          </div>
        </section>

        {/* List form */}
        <section className="pt-10 animate-fadeIn">
          <div className="mb-6">
            <div className="page-kicker mb-3">
              <span className="page-dot" />
              Seller action
            </div>
            <h2 className="section-heading">Create a new property listing</h2>
            <p className="section-subtext mt-2 max-w-2xl">
              Upload property information, mint the asset, approve the escrow contract,
              and publish it to the marketplace through a cleaner guided flow.
            </p>
          </div>

          <ListPropertyForm onSuccess={loadBlockchainData} />
        </section>

        {/* My properties */}
        <section className="pt-10 animate-fadeIn">
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="page-kicker mb-3">
                <span className="page-dot" />
                Seller portfolio
              </div>
              <h2 className="section-heading">My listed properties</h2>
              <p className="section-subtext mt-2 max-w-2xl">
                Review the assets you have listed, monitor sale readiness, and finalize
                eligible transactions directly from your seller workspace.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Visible results
              </div>
              <div className="text-2xl font-bold text-slate-900">
                {myListings.length}
              </div>
            </div>
          </div>

          <div className="grid-divider mb-6" />

          {myListings.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
              {myListings.map((property) => (
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
                🏠
              </div>

              <h3 className="text-2xl font-bold tracking-tight text-slate-900">
                You haven&apos;t listed any properties yet
              </h3>

              <p className="mx-auto mt-3 max-w-xl text-slate-500">
                Start by creating your first listing above. Once published, your properties
                will appear here with live workflow progress and seller actions.
              </p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}