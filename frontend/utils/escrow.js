import { ethers } from "ethers";
import { isZeroAddress } from "./helpers";

const toEth = (value) => {
  try {
    return ethers.utils.formatEther(value || 0);
  } catch {
    return "0";
  }
};

export const buildSaleChecklist = ({ listing, contractBalance }) => {
  const buyerFunded = listing && !isZeroAddress(listing.buyer);
  const sellerApproved = Boolean(listing?.sellerApproved);
  const inspectionPassed = Boolean(listing?.inspectionPassed);
  const lenderApproved = Boolean(listing?.lenderApproved);
  const governmentVerified = Boolean(listing?.governmentVerified);
  const sufficientFunds =
    listing?.purchasePrice && contractBalance
      ? contractBalance.gte(listing.purchasePrice)
      : false;

  return {
    buyerFunded,
    sellerApproved,
    inspectionPassed,
    lenderApproved,
    governmentVerified,
    sufficientFunds,
    readyToFinalize:
      buyerFunded &&
      sellerApproved &&
      inspectionPassed &&
      lenderApproved &&
      governmentVerified &&
      sufficientFunds,
    blockers: [
      !buyerFunded ? "Buyer has not deposited escrow yet." : null,
      !inspectionPassed ? "Inspection approval is still pending." : null,
      !lenderApproved ? "Lender approval is still pending." : null,
      !governmentVerified ? "Government verification is still pending." : null,
      !sellerApproved ? "Seller approval has not been recorded on-chain yet." : null,
      !sufficientFunds
        ? `Escrow balance is below the purchase price (${toEth(
            listing?.purchasePrice
          )} ETH required).`
        : null,
    ].filter(Boolean),
  };
};

export const buildSaleChecklistFromProperty = (property) => {
  if (!property) {
    return {
      buyerFunded: false,
      sellerApproved: false,
      inspectionPassed: false,
      lenderApproved: false,
      governmentVerified: false,
      sufficientFunds: false,
      readyToFinalize: false,
      blockers: [],
    };
  }

  return buildSaleChecklist({
    listing: {
      buyer: property.buyer,
      sellerApproved: property.sellerApproved,
      inspectionPassed: property.inspectionPassed,
      lenderApproved: property.lenderApproved,
      governmentVerified: property.governmentVerified,
      purchasePrice: property.purchasePrice,
    },
    contractBalance: property.buyerDeposited ? property.purchasePrice : ethers.constants.Zero,
  });
};

export const getReadableErrorMessage = (error) => {
  const message =
    error?.reason ||
    error?.data?.message ||
    error?.error?.message ||
    error?.message ||
    "Transaction failed.";

  if (String(message).includes("Seller not approved")) {
    return "Seller approval is missing on-chain. Approve the sale first, then refresh, and finalize again.";
  }

  if (String(message).includes("Only seller can finalize sale")) {
    return "Switch to the seller wallet used to list this property before finalizing the sale.";
  }

  if (String(message).includes("Lender not approved")) {
    return "The lender approval step is still pending.";
  }

  if (String(message).includes("Government verification missing")) {
    return "Government verification is still pending.";
  }

  if (String(message).includes("Inspection failed")) {
    return "Inspection has not been approved yet.";
  }

  return message;
};