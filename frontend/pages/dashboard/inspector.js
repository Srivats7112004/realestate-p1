// frontend/pages/dashboard/inspector.js
import { useMemo, useState } from "react";
import { useWeb3 } from "../../context/Web3Context";
import Navbar from "../../components/Navbar";
import PropertyCard from "../../components/PropertyCard";
import AIInspectionPanel from "../../components/AIInspectionPanel";
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

function InspectorDashboardInner() {
  const {
    provider,
    escrow,
    properties,
    loadBlockchainData,
    runAIInspection,
    canUseRoleWallet,
    requiredRoleWallet,
  } = useWeb3();

  const [aiReports, setAiReports] = useState({});
  const [aiErrors, setAiErrors] = useState({});
  const [activeAIPropertyId, setActiveAIPropertyId] = useState(null);
  const [activeTab, setActiveTab] = useState("pending");

  const pending = useMemo(
    () => properties.filter((p) => !p.inspectionPassed && !p.sold),
    [properties]
  );

  const passed = useMemo(
    () => properties.filter((p) => p.inspectionPassed || p.sold),
    [properties]
  );

  const reviewedWithAI = useMemo(
    () => Object.keys(aiReports).length,
    [aiReports]
  );

  const completedCount = passed.length;
  const pendingCount = pending.length;

  const handleAction = async (action, property) => {
    if (action !== "inspect") return;

    if (!provider || !escrow) {
      alert("Wallet or contract not ready.");
      return;
    }

    if (!canUseRoleWallet) {
      alert(
        requiredRoleWallet
          ? `Inspector wallet required:\n${requiredRoleWallet}`
          : "Cannot perform this action with current wallet."
      );
      return;
    }

    try {
      const signer = provider.getSigner();
      const tx = await escrow
        .connect(signer)
        .updateInspectionStatus(property.id, true);

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
      setAiErrors((prev) => ({
        ...prev,
        [property.id]: error.message || "AI inspection failed.",
      }));
    } finally {
      setActiveAIPropertyId(null);
    }
  };

  const tabs = [
    {
      key: "pending",
      label: "Pending Reviews",
      count: pendingCount,
    },
    {
      key: "passed",
      label: "Approved Inspections",
      count: completedCount,
    },
  ];

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
                  Inspector control center
                </div>

                <h1 className="mb-4 text-4xl font-bold tracking-tight text-slate-900 md:text-5xl">
                  Review property readiness with AI support and approve inspections on-chain
                </h1>

                <p className="section-subtext max-w-2xl text-base md:text-lg">
                  Evaluate pending properties, run AI-assisted inspection analysis,
                  and move assets forward in the escrow lifecycle with a clearer professional workflow.
                </p>

                <div className="mt-7 flex flex-wrap gap-3">
                  <div className="ghost-chip px-4 py-2 text-sm font-medium">
                    Inspection queue
                  </div>
                  <div className="ghost-chip px-4 py-2 text-sm font-medium">
                    AI-assisted review
                  </div>
                  <div className="ghost-chip px-4 py-2 text-sm font-medium">
                    On-chain approval
                  </div>
                </div>
              </div>

              <div>
                <div className="surface-card-strong p-5 md:p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <div className="text-sm font-semibold text-slate-800">
                        Inspector Snapshot
                      </div>
                      <div className="text-xs text-slate-500">
                        Live review and approval overview
                      </div>
                    </div>

                    <div className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                      Review Mode
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                      <div className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-400">
                        Pending Reviews
                      </div>
                      <div className="text-2xl font-bold text-amber-600">
                        {pendingCount}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                      <div className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-400">
                        Approved Inspections
                      </div>
                      <div className="text-2xl font-bold text-emerald-600">
                        {completedCount}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                      <div className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-400">
                        AI Reports Generated
                      </div>
                      <div className="text-2xl font-bold text-sky-600">
                        {reviewedWithAI}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Wallet auth banner */}
        <section className="pt-6 animate-fadeIn">
          <div
            className={`rounded-2xl border px-5 py-4 text-sm ${
              canUseRoleWallet
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-amber-200 bg-amber-50 text-amber-800"
            }`}
          >
            {canUseRoleWallet ? (
              <div>
                <div className="font-semibold">Inspector wallet authorized</div>
                <div className="mt-1">
                  The connected wallet is allowed to perform inspector actions on-chain.
                </div>
              </div>
            ) : (
              <div>
                <div className="font-semibold">Inspector wallet mismatch</div>
                <div className="mt-1">
                  Your app role is <strong>inspector</strong>, but the connected wallet is not the wallet currently authorized for inspector actions in the contract.
                </div>
                {requiredRoleWallet ? (
                  <div className="mt-2 break-all rounded-xl border border-amber-200 bg-white/70 px-3 py-2 font-mono text-xs text-amber-900">
                    Required wallet: {requiredRoleWallet}
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </section>

        {/* Stats */}
        <section className="pt-8">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Total Properties"
              value={properties.length}
              subtext="All properties currently visible to the inspection workflow."
              color="text-slate-900"
            />

            <StatCard
              label="Pending Inspections"
              value={pendingCount}
              subtext="Properties still awaiting your inspection approval."
              color="text-amber-600"
            />

            <StatCard
              label="Approved"
              value={completedCount}
              subtext="Properties that already passed inspection or completed sale."
              color="text-emerald-600"
            />

            <StatCard
              label="AI Reviews"
              value={reviewedWithAI}
              subtext="Inspection reports generated through the AI review panel."
              color="text-sky-600"
            />
          </div>
        </section>

        {/* Tabs */}
        <section className="pt-10">
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="page-kicker mb-3">
                <span className="page-dot" />
                Inspection views
              </div>
              <h2 className="section-heading">Switch between active reviews and approved inspections</h2>
              <p className="section-subtext mt-2 max-w-2xl">
                Focus on pending evaluations or revisit the properties that have already cleared the inspection stage.
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

        {/* Pending */}
        {activeTab === "pending" && (
          <section className="pt-8 animate-fadeIn">
            <div className="mb-6 flex items-end justify-between gap-4">
              <div>
                <h3 className="section-heading">Pending property inspections</h3>
                <p className="section-subtext mt-2">
                  Review each listing, run AI analysis if needed, and approve the inspection when ready.
                </p>
              </div>

              <div className="hidden rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm md:block">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Results
                </div>
                <div className="text-xl font-bold text-slate-900">{pendingCount}</div>
              </div>
            </div>

            <div className="grid-divider mb-6" />

            {pending.length > 0 ? (
              <div className="space-y-8">
                {pending.map((property) => (
                  <div
                    key={property.id}
                    className="grid gap-6 xl:grid-cols-[minmax(320px,380px)_1fr]"
                  >
                    <div>
                      <PropertyCard property={property} onAction={handleAction} />
                    </div>

                    <div className="surface-card-strong p-5 md:p-6">
                      <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                        <div>
                          <div className="text-sm font-semibold text-slate-900">
                            AI Inspection Review
                          </div>
                          <div className="text-sm text-slate-500">
                            Generate a structured inspection summary before approving the asset.
                          </div>
                        </div>

                        <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                          Property #{property.id}
                        </div>
                      </div>

                      <AIInspectionPanel
                        property={property}
                        report={aiReports[property.id]}
                        error={aiErrors[property.id]}
                        loading={activeAIPropertyId === property.id}
                        onRun={handleAIRun}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="surface-card-strong px-6 py-20 text-center">
                <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 text-4xl">
                  ✅
                </div>

                <h3 className="text-2xl font-bold tracking-tight text-slate-900">
                  All inspections are complete
                </h3>

                <p className="mx-auto mt-3 max-w-xl text-slate-500">
                  There are no pending properties awaiting inspection right now.
                  Come back when new listings enter the review queue.
                </p>
              </div>
            )}
          </section>
        )}

        {/* Passed */}
        {activeTab === "passed" && (
          <section className="pt-8 animate-fadeIn">
            <div className="mb-6 flex items-end justify-between gap-4">
              <div>
                <h3 className="section-heading">Approved inspections</h3>
                <p className="section-subtext mt-2">
                  Review the properties that have already passed inspection or completed the workflow.
                </p>
              </div>

              <div className="hidden rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm md:block">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Results
                </div>
                <div className="text-xl font-bold text-slate-900">{completedCount}</div>
              </div>
            </div>

            <div className="grid-divider mb-6" />

            {passed.length > 0 ? (
              <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
                {passed.map((property) => (
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
                  🔍
                </div>

                <h3 className="text-2xl font-bold tracking-tight text-slate-900">
                  No approved inspections yet
                </h3>

                <p className="mx-auto mt-3 max-w-xl text-slate-500">
                  Once properties pass inspection, they will appear here for quick review.
                </p>
              </div>
            )}
          </section>
        )}
      </main>
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