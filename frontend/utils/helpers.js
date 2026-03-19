// frontend/utils/helpers.js
import { ethers } from "ethers";

/**
 * Shorten an Ethereum address for display
 */
export const shortenAddress = (address) => {
  if (!address) return "N/A";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

/**
 * Format ETH value from wei
 */
export const formatEth = (weiValue) => {
  try {
    return parseFloat(ethers.utils.formatEther(weiValue)).toFixed(4);
  } catch {
    return "0";
  }
};

/**
 * Check if address is zero address (no buyer yet)
 */
export const isZeroAddress = (address) => {
  return !address || address === ethers.constants.AddressZero;
};

/**
 * Get role name from address
 */
export const getRoleName = (address, roles) => {
  if (!address) return "Unknown";
  const addr = address.toLowerCase();
  if (addr === roles.inspector.toLowerCase()) return "Inspector";
  if (addr === roles.lender.toLowerCase()) return "Lender";
  if (addr === roles.government.toLowerCase()) return "Government";
  return "User";
};

/**
 * Calculate completion percentage for a property sale
 */
export const getCompletionPercentage = (property) => {
  let completed = 1; // Listed = always true
  const total = 7;

  if (property.governmentVerified) completed++;
  if (property.inspectionPassed) completed++;
  if (property.buyerDeposited) completed++;
  if (property.lenderApproved) completed++;
  if (property.sellerApproved) completed++;
  if (property.sold) completed++;

  return Math.round((completed / total) * 100);
};

/**
 * Parse IPFS metadata JSON from tokenURI
 * Handles both direct image URLs and JSON metadata
 */
export const parseTokenMetadata = async (uri) => {
  // If it's a direct IPFS image URL (old format)
  if (
    uri.endsWith(".jpg") ||
    uri.endsWith(".png") ||
    uri.endsWith(".jpeg") ||
    uri.endsWith(".gif") ||
    uri.endsWith(".webp")
  ) {
    return {
      name: "Untitled Property",
      description: "",
      image: uri,
      attributes: {},
    };
  }

  // Try to fetch as JSON metadata (new format)
  try {
    const response = await fetch(uri);
    if (response.ok) {
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const metadata = await response.json();
        return {
          name: metadata.name || "Untitled Property",
          description: metadata.description || "",
          image: metadata.image || uri,
          attributes: metadata.attributes || {},
          location: metadata.location || "",
          propertyType: metadata.propertyType || "",
          area: metadata.area || "",
          documents: metadata.documents || "",
        };
      }
    }
  } catch (e) {
    console.log("Could not parse as JSON metadata, using as image URL");
  }

  // Fallback: treat URI as image
  return {
    name: "Untitled Property",
    description: "",
    image: uri,
    attributes: {},
  };
};

/**
 * Get time ago string from timestamp
 */
export const timeAgo = (timestamp) => {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
};