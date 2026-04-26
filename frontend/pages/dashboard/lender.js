import { useMemo, useState } from "react";
import { useWeb3 } from "../../context/Web3Context";
import Navbar from "../../components/Navbar";
import PropertyCard from "../../components/PropertyCard";
import AuthGuard from "../../components/AuthGuard";

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

function LenderDashboardInner() {
  const {
    provider,
    escrow,
    properties,
    loadBlockchainData,
    canUseRoleWallet,
    contractRoleStatus,
  } = useWeb3();

  const [activeTab, setActiveTab] = useState("pending");

  const pending = useMemo(
    () => properties.filter((p) => p.buyerDeposited && !p.lenderApproved && !p.sold),
    [properties]
  );

  const approved = useMemo(
    () => properties.filter((p) => p.lenderApproved || p.sold),
    [properties]
  );

  const fundedDeals = useMemo(
    () => properties.filter((p) => p.buyerDeposited).length,
    [properties]
  );

  const tabs = [
    {
      key: "pending",
      label: "Pending Loan Approval",
      count: pending.length,
    },
    {
      key: "approved",
      label: "Approved Properties",
      count: approved.length,
    },
  ];

  const handleAction = async (action, property) => {
    try {
      if (action !== "lend") return;

      if (!provider || !escrow) {
        alert("Wallet or contract not ready.");
        return;
      }

      if (!canUseRoleWallet || !contractRoleStatus.lender) {
        alert(
          "The connected wallet does not currently have LENDER role on-chain. Grant the role in the Escrow contract or connect a wallet that already has it."
        );
        return;
      }

      if (!property.buyerDeposited) {
        alert("Buyer has not funded escrow yet.");
        return;
      }

      const signer = provider.getSigner();
      const tx = await escrow.connect(signer).approveSale(property.id);
      await tx.wait();

      alert("Loan approved!");
      await loadBlockchainData(false);
    } catch (error) {
      console.error("Lender approval failed:", error);
      alert(error?.reason || error?.message || "Lender approval failed.");
    }
  };

  return (
    <div className="app-shell min-h-screen">
      <Navbar />

      <main className="app-container py-8 md:py-10">
        <section className="animate-fadeIn">
          <div className="hero-panel overflow-hidden px-6 py-8 md:px-10 md:py-10">
            <div className="grid items-center gap-10 lg:grid-cols-[1.08fr_0.92fr]">
              <div>
                <div className="page-kicker mb-5">
                  <span className="page-dot" />
                  Lender approval center
                </div>

                <h1 className="mb-4 text-4xl font-bold tracking-tight text-slate-900 md:text-5xl">
                  Review escrow-funded deals and record lender approval with a cleaner workflow
                </h1>

                <p className="section-subtext max-w-2xl text-base md:text-lg">
                  Focus on funded transactions, approve viable deals on-chain,
                  and track the lending stage of the property workflow from one professional dashboard.
                </p>

                <div className="mt-7 flex flex-wrap gap-3">
                  <div className="ghost-chip px-4 py-2 text-sm font-medium">
                    Escrow-funded deals
                  </div>
                  <div className="ghost-chip px-4 py-2 text-sm font-medium">
                    Lender approvals
                  </div>
                  <div className="ghost-chip px-4 py-2 text-sm font-medium">
                    Workflow monitoring
                  </div>
                </div>
              </div>

              <div>
                <div className="surface-card-strong p-5 md:p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <div className="text-sm font-semibold text-slate-800">
                        Lending Snapshot
                      </div>
                      <div className="text-xs text-slate-500">
                        Live deal approval overview
                      </div>
                    </div>

                    <div className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
                      Funding stage
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                      <div className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-400">
                        Escrow-Funded Deals
                      </div>
                      <div className="text-2xl font-bold text-sky-600">
                        {fundedDeals}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                      <div className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-400">
                        Pending Loan Approval
                      </div>
                      <div className="text-2xl font-bold text-amber-600">
                        {pending.length}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                      <div className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-400">
                        Approved Deals
                      </div>
                      <div className="text-2xl font-bold text-emerald-600">
                        {approved.length}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="pt-6 animate-fadeIn">
          <div
            className={`rounded-2xl border px-5 py-4 text-sm ${
              contractRoleStatus.lender
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-amber-200 bg-amber-50 text-amber-800"
            }`}
          >
            {contractRoleStatus.lender ? (
              <div>
                <div className="font-semibold">Lender wallet authorized</div>
                <div className="mt-1">
                  The connected wallet currently has <strong>LENDER</strong> role on-chain and can approve eligible deals.
                </div>
              </div>
            ) : (
              <div>
                <div className="font-semibold">Lender wallet mismatch</div>
                <div className="mt-1">
                  Your app role is lender, but the connected wallet does <strong>not</strong> currently
                  have lender role on-chain. Grant the role in the contract or connect a wallet that has it.
                </div>
              </div>
            )}
          </div>
        </section>

        <section className="pt-8">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Total Properties"
              value={properties.length}
              subtext="All listed properties currently visible to the lending workflow."
              color="text-slate-900"
            />

            <StatCard
              label="Escrow Funded"
              value={fundedDeals}
              subtext="Deals where the buyer has already deposited escrow funds."
              color="text-sky-600"
            />

            <StatCard
              label="Pending Approval"
              value={pending.length}
              subtext="Funded deals still waiting for lender approval."
              color="text-amber-600"
            />

            <StatCard
              label="Approved"
              value={approved.length}
              subtext="Deals that already have lender approval or completed sale."
              color="text-emerald-600"
            />
          </div>
        </section>

        <section className="pt-10">
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="page-kicker mb-3">
                <span className="page-dot" />
                Lending views
              </div>
              <h2 className="section-heading">Switch between pending and approved lending decisions</h2>
              <p className="section-subtext mt-2 max-w-2xl">
                Focus on deals that still need lender action or review the properties already approved.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Current view
              </div>
              <div className="text-2xl font-bold text-slate-900">
                {activeTab === "pending" ? "Pending" : "Approved"}
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

        {activeTab === "pending" && (
          <section className="pt-8 animate-fadeIn">
            <div className="mb-6 flex items-end justify-between gap-4">
              <div>
                <h3 className="section-heading">Pending loan approvals</h3>
                <p className="section-subtext mt-2">
                  These properties have buyer escrow funding but still require lender approval.
                </p>
              </div>

              <div className="hidden rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm md:block">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Results
                </div>
                <div className="text-xl font-bold text-slate-900">{pending.length}</div>
              </div>
            </div>

            <div className="grid-divider mb-6" />

            {pending.length > 0 ? (
              <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
                {pending.map((property) => (
                  <PropertyCard
                    key={property.id}
                    property={property}
                    onAction={handleAction}
                  />
                ))}
              </div>
            ) : (
              <div className="surface-card-strong px-6 py-20 text-center">
                <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 text-4xl">
                  ✅
                </div>

                <h3 className="text-2xl font-bold tracking-tight text-slate-900">
                  No pending loan approvals
                </h3>

                <p className="mx-auto mt-3 max-w-xl text-slate-500">
                  There are currently no escrow-funded deals waiting for lender approval.
                </p>
              </div>
            )}
          </section>
        )}

        {activeTab === "approved" && (
          <section className="pt-8 animate-fadeIn">
            <div className="mb-6 flex items-end justify-between gap-4">
              <div>
                <h3 className="section-heading">Approved properties</h3>
                <p className="section-subtext mt-2">
                  These properties already have lender approval or completed the workflow.
                </p>
              </div>

              <div className="hidden rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm md:block">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Results
                </div>
                <div className="text-xl font-bold text-slate-900">{approved.length}</div>
              </div>
            </div>

            <div className="grid-divider mb-6" />

            {approved.length > 0 ? (
              <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
                {approved.map((property) => (
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
                  🏦
                </div>

                <h3 className="text-2xl font-bold tracking-tight text-slate-900">
                  No approved properties yet
                </h3>

                <p className="mx-auto mt-3 max-w-xl text-slate-500">
                  Once lender approvals are recorded, those properties will appear here.
                </p>
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}

export default function LenderDashboardPage() {
  return (
    <AuthGuard allowedRoles={["lender"]}>
      <LenderDashboardInner />
    </AuthGuard>
  );
}