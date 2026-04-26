import Link from "next/link";
import {
  shortenAddress,
  isZeroAddress,
  getCompletionPercentage,
} from "../utils/helpers";
import { useWeb3 } from "../context/Web3Context";

function StatusChip({ children, tone = "slate" }) {
  const tones = {
    sky: "bg-sky-50 text-sky-700 border-sky-100",
    green: "bg-emerald-50 text-emerald-700 border-emerald-100",
    amber: "bg-amber-50 text-amber-700 border-amber-100",
    red: "bg-red-50 text-red-700 border-red-100",
    slate: "bg-white/90 text-slate-700 border-slate-200",
  };

  return (
    <span
      className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold backdrop-blur-sm ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

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

  const isBuyer =
    !!account &&
    !!property.buyer &&
    !isZeroAddress(property.buyer) &&
    account.toLowerCase() === property.buyer.toLowerCase();

  const isNormalUser = userRole === "user" || userRole === "admin";
  const canShowSellerAction = isNormalUser && isSeller;
  const canShowBuyerAction =
    isNormalUser && !isSeller && !property.sold && !buyerExists;

  const completion = getCompletionPercentage(property);

  const sellerCanFinalize =
    buyerExists &&
    property.governmentVerified &&
    property.inspectionPassed &&
    property.lenderApproved &&
    !property.sold;

  const statusText = property.sold
    ? "Sold"
    : buyerExists
    ? "Sale in progress"
    : "Available";

  const nextStepText = property.sold
    ? "Ownership transferred"
    : !buyerExists
    ? "Awaiting buyer deposit"
    : !property.governmentVerified
    ? "Government verification pending"
    : !property.inspectionPassed
    ? "Inspection pending"
    : !property.lenderApproved
    ? "Lender approval pending"
    : "Ready for seller finalize";

  const cardBorderClass = property.sold
    ? "border-emerald-200"
    : completion >= 50
    ? "border-sky-200"
    : "border-slate-200";

  const renderAction = () => {
    if (userRole === "government") {
      return (
        <button
          onClick={() => onAction?.("verify", property)}
          disabled={property.governmentVerified || !canUseRoleWallet}
          className="primary-btn flex-1 px-4 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-50"
        >
          {property.governmentVerified ? "Verified" : "Verify"}
        </button>
      );
    }

    if (userRole === "inspector") {
      return (
        <button
          onClick={() => onAction?.("inspect", property)}
          disabled={property.inspectionPassed || !canUseRoleWallet}
          className="primary-btn flex-1 px-4 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-50"
        >
          {property.inspectionPassed ? "Passed" : "Inspect"}
        </button>
      );
    }

    if (userRole === "lender") {
      return (
        <button
          onClick={() => onAction?.("lend", property)}
          disabled={property.lenderApproved || !canUseRoleWallet || !buyerExists}
          className="primary-btn flex-1 px-4 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-50"
        >
          {property.lenderApproved ? "Approved" : "Approve Loan"}
        </button>
      );
    }

    if (canShowSellerAction) {
      return (
        <button
          onClick={() => onAction?.("sell", property)}
          disabled={!canUseConnectedWallet || !sellerCanFinalize}
          className="primary-btn flex-1 px-4 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-50"
        >
          {property.sold ? "Sold" : "Finalize Sale"}
        </button>
      );
    }

    if (canShowBuyerAction) {
      return (
        <button
          onClick={() => onAction?.("buy", property)}
          disabled={!canUseConnectedWallet}
          className="primary-btn flex-1 px-4 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-50"
        >
          Buy Property
        </button>
      );
    }

    return (
      <div className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-center text-sm font-semibold text-slate-500">
        No action
      </div>
    );
  };

  return (
    <div
      className={`group overflow-hidden rounded-[1.5rem] border bg-white shadow-[0_14px_36px_rgba(15,23,42,0.06)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_48px_rgba(14,165,233,0.12)] ${cardBorderClass}`}
    >
      <div className="relative">
        <img
          src={property.image}
          alt={property.name || `Property ${property.id}`}
          className="h-60 w-full object-cover transition duration-500 group-hover:scale-[1.03]"
          onError={(e) => {
            e.target.src =
              "https://via.placeholder.com/800x480?text=Property+Image";
          }}
        />

        <div className="absolute inset-x-0 top-0 flex items-start justify-between p-4">
          <div className="flex flex-wrap gap-2">
            {property.sold ? <StatusChip tone="green">Sold</StatusChip> : null}
            {property.governmentVerified ? (
              <StatusChip tone="sky">Verified</StatusChip>
            ) : null}
            {property.propertyType ? (
              <StatusChip tone="slate">{property.propertyType}</StatusChip>
            ) : null}
          </div>

          <div className="rounded-2xl border border-white/60 bg-white/90 px-3 py-2 text-right shadow-sm backdrop-blur">
            <div className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
              Price
            </div>
            <div className="text-base font-bold text-sky-700">
              {property.price} ETH
            </div>
          </div>
        </div>

        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/55 via-slate-900/10 to-transparent px-4 pb-4 pt-10">
          <div className="text-sm font-medium text-white/90">
            {property.location || "Location unavailable"}
          </div>
        </div>
      </div>

      <div className="p-5">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h3 className="text-xl font-bold tracking-tight text-slate-900">
              {property.name || `Property #${property.id}`}
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              {statusText} · Token #{property.id}
            </p>
          </div>

          {property.area ? (
            <div className="rounded-2xl bg-slate-50 px-3 py-2 text-right">
              <div className="text-[11px] uppercase tracking-wide text-slate-400">
                Area
              </div>
              <div className="text-sm font-semibold text-slate-700">
                {property.area} sq ft
              </div>
            </div>
          ) : null}
        </div>

        <div className="mb-4 rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Workflow Progress
            </span>
            <span className="text-sm font-bold text-sky-700">
              {completion}%
            </span>
          </div>

          <div className="mb-3 h-2 overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full rounded-full bg-gradient-to-r from-sky-500 to-cyan-400 transition-all duration-500"
              style={{ width: `${completion}%` }}
            />
          </div>

          <div className="text-sm text-slate-600">
            <span className="font-semibold text-slate-800">Next step:</span>{" "}
            {nextStepText}
          </div>
        </div>

        <div className="mb-4 grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-2xl border border-slate-200 bg-white p-3">
            <div className="mb-1 text-xs uppercase tracking-wide text-slate-400">
              Seller
            </div>
            <div className="font-medium text-slate-700">
              {shortenAddress(property.seller)}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-3">
            <div className="mb-1 text-xs uppercase tracking-wide text-slate-400">
              Buyer
            </div>
            <div className="font-medium text-slate-700">
              {buyerExists ? shortenAddress(property.buyer) : "Not assigned"}
            </div>
          </div>
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          <StatusChip tone={buyerExists ? "green" : "slate"}>
            Buyer funded
          </StatusChip>
          <StatusChip tone={property.governmentVerified ? "green" : "slate"}>
            Government
          </StatusChip>
          <StatusChip tone={property.inspectionPassed ? "green" : "slate"}>
            Inspection
          </StatusChip>
          <StatusChip tone={property.lenderApproved ? "green" : "slate"}>
            Lender
          </StatusChip>
        </div>

        {canShowSellerAction && !sellerCanFinalize && !property.sold ? (
          <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Finalize becomes available after buyer funding, inspection, lender approval, and government verification.
          </div>
        ) : null}

        {isBuyer && property.sold ? (
          <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            This property is now owned by your connected wallet.
          </div>
        ) : null}

        <div className="flex gap-3">
          <Link
            href={`/property/property-detail?id=${property.id}`}
            className="secondary-btn flex-1 px-4 py-3 text-center text-sm"
          >
            View Details
          </Link>
          {renderAction()}
        </div>
      </div>
    </div>
  );
}