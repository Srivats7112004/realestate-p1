// frontend/components/PropertyCard.js
import Link from "next/link";
import { ethers } from "ethers";
import { shortenAddress, isZeroAddress, getCompletionPercentage } from "../utils/helpers";
import { useWeb3 } from "../context/Web3Context";
import { ROLES } from "../utils/constants";

export default function PropertyCard({ property, onAction }) {
  const { account, userRole } = useWeb3();

  const buyerExists = !isZeroAddress(property.buyer);
  const isSeller =
    account &&
    property.seller &&
    account.toLowerCase() === property.seller.toLowerCase();
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
      {/* Image */}
      <div className="relative">
        <img
          src={property.image}
          alt={property.name || `Property ${property.id}`}
          className="w-full h-56 object-cover"
          onError={(e) => {
            e.target.src = "https://via.placeholder.com/400x250?text=Property+Image";
          }}
        />

        {/* Badge overlay */}
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

        {/* Price badge */}
        <div className="absolute bottom-3 right-3">
          <span className="bg-white/90 backdrop-blur text-indigo-700 font-bold px-3 py-1.5 rounded-lg shadow text-sm">
            {property.price} ETH
          </span>
        </div>
      </div>

      {/* Content */}
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

        {/* Property details */}
        {property.area && (
          <p className="text-xs text-slate-500 mb-2">📐 {property.area} sq ft</p>
        )}

        <p className="text-xs text-slate-400 mb-3">
          Seller: {shortenAddress(property.seller)}
        </p>

        {/* Mini progress bar */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-slate-400">Sale Progress</span>
            <span className="text-xs font-bold text-indigo-600">
              {completion}%
            </span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5">
            <div
              className="bg-indigo-500 h-1.5 rounded-full progress-bar"
              style={{ width: `${completion}%` }}
            ></div>
          </div>
        </div>

        {/* Quick status */}
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
              buyerExists
                ? "bg-green-100 text-green-700"
                : "bg-slate-100 text-slate-400"
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

        {/* Action buttons */}
        <div className="flex gap-2">
  <Link
    href={`/property/property-detail?id=${property.id}`}
    className="flex-1 text-center bg-slate-100 text-slate-700 py-2.5 rounded-lg font-semibold text-sm hover:bg-slate-200 transition"
  >
    View Details
  </Link>
          {account === ROLES.government && !property.governmentVerified ? (
            <button
              onClick={() => onAction("verify", property)}
              className="flex-1 bg-red-600 text-white py-2.5 rounded-lg font-semibold text-sm hover:bg-red-700 transition"
            >
              Verify
            </button>
          ) : account === ROLES.inspector && !property.inspectionPassed ? (
            <button
              onClick={() => onAction("inspect", property)}
              className="flex-1 bg-orange-500 text-white py-2.5 rounded-lg font-semibold text-sm hover:bg-orange-600 transition"
            >
              Inspect
            </button>
          ) : account === ROLES.lender && !property.lenderApproved ? (
            <button
              onClick={() => onAction("lend", property)}
              className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg font-semibold text-sm hover:bg-blue-700 transition"
            >
              Approve
            </button>
          ) : isSeller ? (
            <button
              onClick={() => onAction("sell", property)}
              className="flex-1 bg-purple-600 text-white py-2.5 rounded-lg font-semibold text-sm hover:bg-purple-700 transition"
            >
              Finalize
            </button>
          ) : !buyerExists ? (
            <button
              onClick={() => onAction("buy", property)}
              className="flex-1 bg-indigo-600 text-white py-2.5 rounded-lg font-semibold text-sm hover:bg-indigo-700 transition"
            >
              Buy
            </button>
          ) : (
            <span className="flex-1 text-center bg-green-100 text-green-700 py-2.5 rounded-lg font-semibold text-sm">
              Funded ✅
            </span>
          )}
        </div>  
      </div>
    </div>
  );
}