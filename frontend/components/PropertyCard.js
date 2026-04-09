import Link from "next/link";
import {
  shortenAddress,
  isZeroAddress,
  getCompletionPercentage,
} from "../utils/helpers";
import { useWeb3 } from "../context/Web3Context";

export default function PropertyCard({ property, onAction }) {
  const {
    account,
    userRole,
    canUseConnectedWallet,
    canUseRoleWallet,
  } = useWeb3();

  const buyerExists = !isZeroAddress(property.buyer);

  const isSeller =
    !!account &&
    !!property.seller &&
    account.toLowerCase() === property.seller.toLowerCase();

  const isNormalUser = userRole === "user" || userRole === "admin";

  const canShowSellerAction = isNormalUser && isSeller;
  const canShowBuyerAction = isNormalUser && !isSeller && !property.sold;

  const completion = getCompletionPercentage(property);

  const getStatusColor = () => {
    if (completion === 100) return "border-green-400";
    if (completion >= 50) return "border-yellow-400";
    return "border-slate-200";
  };

  return (
    <div
      className={`property-card bg-white rounded-2xl shadow-lg overflow-hidden border-2 ${getStatusColor()} animate-fadeIn`}
    >
      <div className="relative">
        <img
          src={property.image}
          alt={property.name || `Property ${property.id}`}
          className="w-full h-56 object-cover"
          onError={(e) => {
            e.target.src = "https://via.placeholder.com/400x250?text=Property+Image";
          }}
        />

        <div className="absolute top-3 left-3 flex gap-2">
          {property.governmentVerified && (
            <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full font-semibold">
              ✅ Verified
            </span>
          )}

          {property.propertyType && (
            <span className="bg-indigo-500 text-white text-xs px-2 py-1 rounded-full font-semibold">
              {property.propertyType}
            </span>
          )}
        </div>

        <div className="absolute bottom-3 right-3">
          <span className="bg-white/90 backdrop-blur text-indigo-700 font-bold px-3 py-1.5 rounded-lg shadow text-sm">
            {property.price} ETH
          </span>
        </div>
      </div>

      <div className="p-5">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h3 className="text-lg font-bold text-slate-800">
              {property.name || `Property #${property.id}`}
            </h3>

            {property.location && (
              <p className="text-sm text-slate-500 flex items-center gap-1">
                📍 {property.location}
              </p>
            )}
          </div>

          <span className="text-xs bg-slate-100 text-slate-500 px-2 py-1 rounded-full">
            #{property.id}
          </span>
        </div>

        {property.area && (
          <p className="text-xs text-slate-500 mb-2">📐 {property.area} sq ft</p>
        )}

        <p className="text-xs text-slate-400 mb-3">
          Seller: {shortenAddress(property.seller)}
        </p>

        <div className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-slate-400">Sale Progress</span>
            <span className="text-xs font-bold text-indigo-600">{completion}%</span>
          </div>

          <div className="w-full bg-slate-100 rounded-full h-1.5">
            <div
              className="bg-indigo-500 h-1.5 rounded-full progress-bar"
              style={{ width: `${completion}%` }}
            ></div>
          </div>
        </div>

        <div className="flex flex-wrap gap-1 mb-4">
          <span
            className={`text-xs px-2 py-0.5 rounded-full ${
              property.governmentVerified
                ? "bg-green-100 text-green-700"
                : "bg-slate-100 text-slate-400"
            }`}
          >
            🏛 Gov
          </span>

          <span
            className={`text-xs px-2 py-0.5 rounded-full ${
              property.inspectionPassed
                ? "bg-green-100 text-green-700"
                : "bg-slate-100 text-slate-400"
            }`}
          >
            🔍 Inspect
          </span>

          <span
            className={`text-xs px-2 py-0.5 rounded-full ${
              buyerExists ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-400"
            }`}
          >
            💰 Funded
          </span>

          <span
            className={`text-xs px-2 py-0.5 rounded-full ${
              property.lenderApproved
                ? "bg-green-100 text-green-700"
                : "bg-slate-100 text-slate-400"
            }`}
          >
            🏦 Lender
          </span>
        </div>

        <div className="flex gap-2">
          <Link
            href={`/property/property-detail?id=${property.id}`}
            className="flex-1 text-center bg-slate-100 text-slate-700 py-2.5 rounded-lg font-semibold text-sm hover:bg-slate-200 transition"
          >
            View Details
          </Link>

          {userRole === "government" ? (
            <button
              onClick={() => onAction("verify", property)}
              disabled={property.governmentVerified || !canUseRoleWallet}
              className="flex-1 bg-red-600 text-white py-2.5 rounded-lg font-semibold text-sm hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
            >
              {property.governmentVerified ? "Verified" : "Verify"}
            </button>
          ) : userRole === "inspector" ? (
            <button
              onClick={() => onAction("inspect", property)}
              disabled={property.inspectionPassed || !canUseRoleWallet}
              className="flex-1 bg-orange-500 text-white py-2.5 rounded-lg font-semibold text-sm hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
            >
              {property.inspectionPassed ? "Passed" : "Inspect"}
            </button>
          ) : userRole === "lender" ? (
            <button
              onClick={() => onAction("lend", property)}
              disabled={property.lenderApproved || !canUseRoleWallet}
              className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg font-semibold text-sm hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
            >
              {property.lenderApproved ? "Approved" : "Approve"}
            </button>
          ) : canShowSellerAction ? (
            <button
              onClick={() => onAction("sell", property)}
              disabled={!canUseConnectedWallet}
              className="flex-1 bg-purple-600 text-white py-2.5 rounded-lg font-semibold text-sm hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
            >
              Finalize
            </button>
          ) : canShowBuyerAction ? (
            <button
              onClick={() => onAction("buy", property)}
              disabled={buyerExists || !canUseConnectedWallet}
              className="flex-1 bg-indigo-600 text-white py-2.5 rounded-lg font-semibold text-sm hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
            >
              {buyerExists ? "Funded ✅" : "Buy"}
            </button>
          ) : (
            <span className="flex-1 text-center bg-slate-100 text-slate-500 py-2.5 rounded-lg font-semibold text-sm">
              No action
            </span>
          )}
        </div>
      </div>
    </div>
  );
}