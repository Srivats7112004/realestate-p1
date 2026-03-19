// frontend/components/StatusTimeline.js
import { STATUS_STEPS } from "../utils/constants";
import { getCompletionPercentage } from "../utils/helpers";

export default function StatusTimeline({ property }) {
  const completion = getCompletionPercentage(property);

  const steps = [
    { key: "listed", done: true, label: "Listed", icon: "📋" },
    {
      key: "governmentVerified",
      done: property.governmentVerified,
      label: "Gov Verified",
      icon: "🏛",
    },
    {
      key: "inspectionPassed",
      done: property.inspectionPassed,
      label: "Inspected",
      icon: "🔍",
    },
    {
      key: "buyerDeposited",
      done: property.buyerDeposited,
      label: "Buyer Funded",
      icon: "💰",
    },
    {
      key: "lenderApproved",
      done: property.lenderApproved,
      label: "Lender OK",
      icon: "🏦",
    },
    {
      key: "sellerApproved",
      done: property.sellerApproved,
      label: "Seller OK",
      icon: "✍️",
    },
  ];

  return (
    <div className="space-y-3">
      {/* Progress bar */}
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-semibold text-slate-500">Progress</span>
        <span className="text-xs font-bold text-indigo-600">{completion}%</span>
      </div>
      <div className="w-full bg-slate-200 rounded-full h-2.5">
        <div
          className="bg-indigo-600 h-2.5 rounded-full progress-bar"
          style={{ width: `${completion}%` }}
        ></div>
      </div>

      {/* Steps */}
      <div className="space-y-2 mt-3">
        {steps.map((step, index) => (
          <div
            key={step.key}
            className={`flex items-center gap-3 p-2 rounded-lg transition ${
              step.done
                ? "bg-green-50 border border-green-200"
                : "bg-slate-50 border border-slate-200"
            }`}
          >
            <span className="text-lg">{step.icon}</span>
            <span
              className={`text-sm font-medium flex-1 ${
                step.done ? "text-green-700" : "text-slate-500"
              }`}
            >
              {step.label}
            </span>
            <span className="text-sm">{step.done ? "✅" : "⏳"}</span>
          </div>
        ))}
      </div>
    </div>
  );
}