import { useMemo, useState } from "react";
import { useWeb3 } from "../context/Web3Context";

const statusConfig = {
  none: {
    label: "Not Verified",
    tone: "border-slate-200 bg-slate-50 text-slate-600",
    dot: "bg-slate-400",
    buttonTone:
      "border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100",
  },
  pending: {
    label: "KYC Pending",
    tone: "border-amber-200 bg-amber-50 text-amber-700",
    dot: "bg-amber-500",
    buttonTone:
      "border-slate-200 bg-slate-100 text-slate-500 cursor-not-allowed",
  },
  verified: {
    label: "KYC Verified",
    tone: "border-emerald-200 bg-emerald-50 text-emerald-700",
    dot: "bg-emerald-500",
    buttonTone:
      "border-slate-200 bg-slate-100 text-slate-500 cursor-not-allowed",
  },
  rejected: {
    label: "KYC Rejected",
    tone: "border-red-200 bg-red-50 text-red-700",
    dot: "bg-red-500",
    buttonTone:
      "border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100",
  },
};

export default function KYCBadge({ address, showRequestButton = false }) {
  const { getKYCStatus, requestKYC } = useWeb3();
  const [submitting, setSubmitting] = useState(false);

  const status = getKYCStatus(address);
  const config = statusConfig[status] || statusConfig.none;

  const helperText = useMemo(() => {
    if (status === "verified") {
      return "This wallet has completed KYC review.";
    }
    if (status === "pending") {
      return "KYC request has been submitted and is awaiting review.";
    }
    if (status === "rejected") {
      return "Previous KYC request was rejected. You can submit again.";
    }
    return "This wallet has not submitted a KYC request yet.";
  }, [status]);

  const canRequest = showRequestButton && (status === "none" || status === "rejected");

  const handleRequest = async () => {
    if (!address || !canRequest) return;

    try {
      setSubmitting(true);
      await requestKYC(address);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="inline-flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold ${config.tone}`}
        >
          <span className={`h-2.5 w-2.5 rounded-full ${config.dot}`} />
          <span>{config.label}</span>
        </span>

        {canRequest ? (
          <button
            type="button"
            onClick={handleRequest}
            disabled={submitting}
            className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${config.buttonTone} ${
              submitting ? "opacity-60" : ""
            }`}
          >
            {submitting ? "Submitting..." : "Request KYC"}
          </button>
        ) : null}
      </div>

      <p className="text-xs text-slate-500">{helperText}</p>
    </div>
  );
}