const verdictStyles = {
  approve: "bg-green-50 border-green-200 text-green-700",
  review: "bg-amber-50 border-amber-200 text-amber-700",
  reject: "bg-red-50 border-red-200 text-red-700",
};

const pillStyles = {
  low: "bg-green-100 text-green-700",
  medium: "bg-amber-100 text-amber-700",
  high: "bg-red-100 text-red-700",
};

export default function AIInspectionPanel({
  property,
  report,
  loading,
  error,
  actionLoading,
  onRun,
  onApprove,
  onReject,
  canApprove = true,
}) {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 border border-orange-100">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h3 className="text-lg font-bold text-slate-800">🤖 AI Inspection Assist</h3>
          <p className="text-sm text-slate-500 mt-1">
            Visual + metadata review for inspector support. This does not write on-chain by itself.
          </p>
        </div>
        <button
          onClick={() => onRun(property)}
          disabled={loading}
          className="bg-orange-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-orange-600 disabled:bg-slate-300 disabled:cursor-not-allowed transition"
        >
          {loading ? "Running..." : "Run AI Review"}
        </button>
      </div>

      {error ? (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {!report ? (
        <div className="rounded-xl bg-slate-50 px-4 py-4 text-sm text-slate-500">
          No AI review yet for this property.
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <span
              className={`px-3 py-1 rounded-full border text-sm font-semibold ${
                verdictStyles[report.verdict] || "bg-slate-50 border-slate-200 text-slate-700"
              }`}
            >
              Verdict: {String(report.verdict || "review").toUpperCase()}
            </span>
            <span className="text-sm text-slate-600 font-medium">Score: {report.score ?? "-"}/100</span>
            <span className="text-sm text-slate-600 font-medium">
              Confidence: {report.confidence ?? "-"}%
            </span>
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                pillStyles[report?.checks?.riskLevel] || "bg-slate-100 text-slate-700"
              }`}
            >
              Risk: {report?.checks?.riskLevel || "unknown"}
            </span>
          </div>

          <div className="rounded-xl bg-slate-50 px-4 py-4">
            <p className="text-sm text-slate-700 leading-6">{report.summary}</p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="rounded-xl border border-slate-200 p-4">
              <h4 className="font-semibold text-slate-700 mb-2">Why the model said this</h4>
              <ul className="space-y-2 text-sm text-slate-600 list-disc pl-5">
                {(report.reasons || []).map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>

            <div className="rounded-xl border border-slate-200 p-4">
              <h4 className="font-semibold text-slate-700 mb-2">Red flags</h4>
              <ul className="space-y-2 text-sm text-slate-600 list-disc pl-5">
                {(report.redFlags || []).length ? (
                  (report.redFlags || []).map((item, idx) => <li key={idx}>{item}</li>)
                ) : (
                  <li>No major red flags detected from the provided evidence.</li>
                )}
              </ul>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="rounded-xl border border-slate-200 p-4">
              <h4 className="font-semibold text-slate-700 mb-3">Inspection checks</h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="text-slate-400">Image quality</div>
                  <div className="font-medium text-slate-700">{report?.checks?.imageQuality || "-"}</div>
                </div>
                <div>
                  <div className="text-slate-400">Visible condition</div>
                  <div className="font-medium text-slate-700">{report?.checks?.visibleCondition || "-"}</div>
                </div>
                <div>
                  <div className="text-slate-400">Metadata consistency</div>
                  <div className="font-medium text-slate-700">{report?.checks?.metadataConsistency || "-"}</div>
                </div>
                <div>
                  <div className="text-slate-400">Documents</div>
                  <div className="font-medium text-slate-700">{report?.checks?.documentPresence || "-"}</div>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 p-4">
              <h4 className="font-semibold text-slate-700 mb-2">Recommended next steps</h4>
              <ul className="space-y-2 text-sm text-slate-600 list-disc pl-5">
                {(report.recommendedNextSteps || []).map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <button
              onClick={() => onApprove?.(property)}
              disabled={!canApprove || actionLoading}
              className="bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition"
            >
              {actionLoading ? "Submitting..." : "Approve On-chain"}
            </button>
            <button
              onClick={() => onReject?.(property)}
              disabled={!canApprove || actionLoading}
              className="bg-red-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition"
            >
              {actionLoading ? "Submitting..." : "Reject On-chain"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}