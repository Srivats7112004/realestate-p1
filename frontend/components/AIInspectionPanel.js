function toneClass(status) {
  const value = String(status || "").toLowerCase();

  if (
    value.includes("pass") ||
    value.includes("approved") ||
    value.includes("good") ||
    value.includes("clear")
  ) {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (
    value.includes("warn") ||
    value.includes("review") ||
    value.includes("attention") ||
    value.includes("moderate")
  ) {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  if (
    value.includes("fail") ||
    value.includes("risk") ||
    value.includes("issue") ||
    value.includes("reject") ||
    value.includes("critical")
  ) {
    return "border-red-200 bg-red-50 text-red-700";
  }

  return "border-sky-200 bg-sky-50 text-sky-700";
}

function formatLabel(label) {
  return String(label || "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function isRenderablePrimitive(value) {
  return (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  );
}

function renderPrimitive(value) {
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return String(value);
}

function extractSummary(report) {
  if (!report) return "";

  return (
    report.summary ||
    report.overallSummary ||
    report.finalSummary ||
    report.overview ||
    report.description ||
    ""
  );
}

function extractStatus(report) {
  if (!report) return "";

  return (
    report.status ||
    report.overallStatus ||
    report.recommendation ||
    report.verdict ||
    report.result ||
    "AI Review"
  );
}

function extractScore(report) {
  if (!report) return null;

  const value =
    report.score ??
    report.riskScore ??
    report.inspectionScore ??
    report.confidenceScore;

  return value === undefined || value === null ? null : value;
}

function extractHighlights(report) {
  if (!report) return [];

  if (Array.isArray(report.highlights)) return report.highlights;
  if (Array.isArray(report.keyFindings)) return report.keyFindings;
  if (Array.isArray(report.findings)) return report.findings;
  if (Array.isArray(report.observations)) return report.observations;

  return [];
}

function extractRisks(report) {
  if (!report) return [];

  if (Array.isArray(report.risks)) return report.risks;
  if (Array.isArray(report.issues)) return report.issues;
  if (Array.isArray(report.concerns)) return report.concerns;
  if (Array.isArray(report.redFlags)) return report.redFlags;

  return [];
}

function extractRecommendations(report) {
  if (!report) return [];

  if (Array.isArray(report.recommendations)) return report.recommendations;
  if (Array.isArray(report.nextSteps)) return report.nextSteps;
  if (Array.isArray(report.actions)) return report.actions;

  return [];
}

function genericEntries(report) {
  if (!report || typeof report !== "object") return [];

  const reserved = new Set([
    "summary",
    "overallSummary",
    "finalSummary",
    "overview",
    "description",
    "status",
    "overallStatus",
    "recommendation",
    "verdict",
    "result",
    "score",
    "riskScore",
    "inspectionScore",
    "confidenceScore",
    "highlights",
    "keyFindings",
    "findings",
    "observations",
    "risks",
    "issues",
    "concerns",
    "redFlags",
    "recommendations",
    "nextSteps",
    "actions",
  ]);

  return Object.entries(report).filter(([key, value]) => {
    if (reserved.has(key)) return false;
    if (value === null || value === undefined) return false;
    return true;
  });
}

function ArraySection({ title, items, tone = "slate" }) {
  if (!items || items.length === 0) return null;

  const toneMap = {
    slate: "border-slate-200 bg-slate-50 text-slate-700",
    sky: "border-sky-200 bg-sky-50 text-sky-800",
    amber: "border-amber-200 bg-amber-50 text-amber-800",
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-800",
    red: "border-red-200 bg-red-50 text-red-800",
  };

  return (
    <div className={`rounded-2xl border p-4 ${toneMap[tone] || toneMap.slate}`}>
      <div className="mb-3 text-sm font-semibold">{title}</div>
      <div className="space-y-2">
        {items.map((item, index) => (
          <div
            key={`${title}-${index}`}
            className="rounded-xl bg-white/70 px-3 py-2 text-sm"
          >
            •{" "}
            {typeof item === "object" && item !== null
              ? JSON.stringify(item)
              : String(item)}
          </div>
        ))}
      </div>
    </div>
  );
}

function GenericReportSection({ entries }) {
  if (!entries.length) return null;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="mb-3 text-sm font-semibold text-slate-800">
        Additional Analysis
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {entries.map(([key, value]) => (
          <div
            key={key}
            className="rounded-xl border border-slate-200 bg-slate-50 p-3"
          >
            <div className="mb-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
              {formatLabel(key)}
            </div>

            {Array.isArray(value) ? (
              <div className="space-y-1 text-sm text-slate-700">
                {value.map((item, index) => (
                  <div key={`${key}-${index}`}>
                    •{" "}
                    {typeof item === "object" && item !== null
                      ? JSON.stringify(item)
                      : String(item)}
                  </div>
                ))}
              </div>
            ) : isRenderablePrimitive(value) ? (
              <div className="text-sm font-medium text-slate-800">
                {renderPrimitive(value)}
              </div>
            ) : (
              <pre className="overflow-x-auto whitespace-pre-wrap text-sm text-slate-700">
                {JSON.stringify(value, null, 2)}
              </pre>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AIInspectionPanel({
  property,
  report,
  loading = false,
  error = "",
  onRun,
}) {
  const summary = extractSummary(report);
  const status = extractStatus(report);
  const score = extractScore(report);
  const highlights = extractHighlights(report);
  const risks = extractRisks(report);
  const recommendations = extractRecommendations(report);
  const extraEntries = genericEntries(report);

  const hasReport =
    !!report &&
    (summary ||
      highlights.length > 0 ||
      risks.length > 0 ||
      recommendations.length > 0 ||
      extraEntries.length > 0);

  return (
    <div className="rounded-[1.5rem] border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 bg-gradient-to-r from-sky-50 to-cyan-50 px-5 py-5 md:px-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="page-kicker mb-3">
              <span className="page-dot" />
              AI inspection assistant
            </div>

            <h3 className="text-xl font-bold tracking-tight text-slate-900">
              Inspection Intelligence Panel
            </h3>

            <p className="mt-2 max-w-2xl text-sm text-slate-600">
              Generate an AI-supported inspection summary for this property before
              recording on-chain approval.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <div className="mb-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
              Property Reference
            </div>
            <div className="text-sm font-semibold text-slate-800">
              {property?.name || `Property #${property?.id ?? "-"}`}
            </div>
          </div>
        </div>
      </div>

      <div className="px-5 py-5 md:px-6 md:py-6">
        <div className="mb-6 grid gap-4 lg:grid-cols-[1fr_auto]">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
              What this does
            </div>
            <p className="text-sm leading-6 text-slate-600">
              The AI review helps summarize property-level issues, readiness signals,
              and follow-up checks. Use it as a support layer for faster evaluation,
              not as a replacement for your own inspection judgment.
            </p>
          </div>

          <button
            type="button"
            onClick={() => onRun?.(property)}
            disabled={loading}
            className="primary-btn min-w-[220px] px-6 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Generating Review..." : "Run AI Inspection"}
          </button>
        </div>

        {error ? (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-700">
            <div className="font-semibold">AI review failed</div>
            <div className="mt-1">{error}</div>
          </div>
        ) : null}

        {loading ? (
          <div className="rounded-[1.25rem] border border-sky-200 bg-sky-50 px-5 py-10 text-center">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full border-4 border-sky-500 border-t-transparent animate-spin" />
            <h4 className="text-lg font-semibold text-sky-800">
              Generating inspection report
            </h4>
            <p className="mt-2 text-sm text-sky-700">
              Reviewing available property details and preparing a structured AI summary.
            </p>
          </div>
        ) : hasReport ? (
          <div className="space-y-5 animate-fadeIn">
            <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="mb-3 flex flex-wrap items-center gap-3">
                  <span
                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${toneClass(
                      status
                    )}`}
                  >
                    {status}
                  </span>

                  {score !== null ? (
                    <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700">
                      Score: {String(score)}
                    </span>
                  ) : null}
                </div>

                <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                  Executive Summary
                </div>

                <p className="mt-2 text-sm leading-7 text-slate-700">
                  {summary || "AI review generated successfully."}
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 text-center">
                  <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                    Highlights
                  </div>
                  <div className="mt-2 text-2xl font-bold text-emerald-600">
                    {highlights.length}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 text-center">
                  <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                    Risks / Issues
                  </div>
                  <div className="mt-2 text-2xl font-bold text-amber-600">
                    {risks.length}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-5 xl:grid-cols-2">
              <ArraySection
                title="Positive Signals / Highlights"
                items={highlights}
                tone="emerald"
              />

              <ArraySection
                title="Risks / Attention Areas"
                items={risks}
                tone="amber"
              />
            </div>

            <ArraySection
              title="Recommended Next Steps"
              items={recommendations}
              tone="sky"
            />

            <GenericReportSection entries={extraEntries} />
          </div>
        ) : (
          <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50 px-6 py-12 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-sky-50 text-3xl">
              🤖
            </div>
            <h4 className="text-xl font-bold tracking-tight text-slate-900">
              No AI review generated yet
            </h4>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-500">
              Run the AI inspection to generate a structured report for this property.
              The output can help you review readiness, concerns, and follow-up checks
              before approving inspection on-chain.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}