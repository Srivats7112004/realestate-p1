// frontend/components/KYCBadge.js
import { useWeb3 } from "../context/Web3Context";

const statusConfig = {
  none: {
    label: "Not Verified",
    bgColor: "bg-gray-100",
    textColor: "text-gray-600",
    icon: "⚪",
  },
  pending: {
    label: "KYC Pending",
    bgColor: "bg-yellow-100",
    textColor: "text-yellow-700",
    icon: "⏳",
  },
  verified: {
    label: "KYC Verified",
    bgColor: "bg-green-100",
    textColor: "text-green-700",
    icon: "✅",
  },
  rejected: {
    label: "KYC Rejected",
    bgColor: "bg-red-100",
    textColor: "text-red-700",
    icon: "❌",
  },
};

export default function KYCBadge({ address, showRequestButton = false }) {
  const { getKYCStatus, requestKYC } = useWeb3();

  const status = getKYCStatus(address);
  const config = statusConfig[status] || statusConfig.none;

  return (
    <div className="flex items-center gap-2">
      <span
        className={`${config.bgColor} ${config.textColor} px-3 py-1 rounded-full text-sm font-semibold inline-flex items-center gap-1`}
      >
        <span>{config.icon}</span>
        <span>{config.label}</span>
      </span>

      {showRequestButton && status === "none" && (
        <button
          onClick={() => requestKYC(address)}
          className="text-xs bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full hover:bg-indigo-200 transition"
        >
          Request KYC
        </button>
      )}
    </div>
  );
}