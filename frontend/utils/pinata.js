// frontend/utils/pinata.js
// UPGRADED: Now supports both file upload AND JSON metadata upload

const JWT =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiIzNjFlYWEyMC03NjFiLTRjMWMtYjMxZC0xNTI2ZTBmNzYwOTgiLCJlbWFpbCI6InNyaXZhdHNtNzExQGdtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJwaW5fcG9saWN5Ijp7InJlZ2lvbnMiOlt7ImRlc2lyZWRSZXBsaWNhdGlvbkNvdW50IjoxLCJpZCI6IkZSQTEifSx7ImRlc2lyZWRSZXBsaWNhdGlvbkNvdW50IjoxLCJpZCI6Ik5ZQzEifV0sInZlcnNpb24iOjF9LCJtZmFfZW5hYmxlZCI6ZmFsc2UsInN0YXR1cyI6IkFDVElWRSJ9LCJhdXRoZW50aWNhdGlvblR5cGUiOiJzY29wZWRLZXkiLCJzY29wZWRLZXlLZXkiOiJjZmJiZDAyNDA2MjllYjBjMzQ5NiIsInNjb3BlZEtleVNlY3JldCI6Ijg4NzI2NDIzNzMzZjZlN2M0YzU2NWZiNjVmYjZmY2ZhNmZmZGU5ZDY4MjFlYjE3MWFmNThiNjIyOTUwNzAyNzAiLCJleHAiOjE4MDM5NzAwODR9.2molXQiZWhabT172RnQkyHrLXg5f4cZ-0FGt-4qj1N0";

const PINATA_API = "https://api.pinata.cloud/pinning";
const GATEWAY = "https://gateway.pinata.cloud/ipfs";

/**
 * Upload a file (image, document) to IPFS via Pinata
 * Returns the IPFS gateway URL
 */
export const uploadFileToIPFS = async (file) => {
  const formData = new FormData();
  formData.append("file", file);

  const metadata = JSON.stringify({
    name: file.name || "Real Estate Asset",
  });
  formData.append("pinataMetadata", metadata);

  const options = JSON.stringify({
    cidVersion: 0,
  });
  formData.append("pinataOptions", options);

  try {
    const res = await fetch(`${PINATA_API}/pinFileToIPFS`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${JWT}`,
      },
      body: formData,
    });

    if (!res.ok) {
      throw new Error(`Pinata upload failed: ${res.status} ${res.statusText}`);
    }

    const resData = await res.json();
    return `${GATEWAY}/${resData.IpfsHash}`;
  } catch (error) {
    console.error("IPFS file upload error:", error);
    throw new Error("Failed to upload file to IPFS");
  }
};

/**
 * Upload JSON metadata to IPFS via Pinata
 * Used for NFT metadata (ERC-721 standard)
 * Returns the IPFS gateway URL for the JSON
 */
export const uploadJSONToIPFS = async (jsonData) => {
  try {
    const res = await fetch(`${PINATA_API}/pinJSONToIPFS`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${JWT}`,
      },
      body: JSON.stringify({
        pinataContent: jsonData,
        pinataMetadata: {
          name: jsonData.name || "Property Metadata",
        },
      }),
    });

    if (!res.ok) {
      throw new Error(
        `Pinata JSON upload failed: ${res.status} ${res.statusText}`
      );
    }

    const resData = await res.json();
    return `${GATEWAY}/${resData.IpfsHash}`;
  } catch (error) {
    console.error("IPFS JSON upload error:", error);
    throw new Error("Failed to upload metadata to IPFS");
  }
};

/**
 * Upload property document (PDF, etc.) to IPFS
 */
export const uploadDocumentToIPFS = async (file) => {
  return await uploadFileToIPFS(file);
};

/**
 * Create and upload complete property metadata
 * Follows NFT metadata standard with real estate extensions
 */
export const createPropertyMetadata = async ({
  name,
  description,
  imageFile,
  location,
  propertyType,
  area,
  bedrooms,
  bathrooms,
  yearBuilt,
  documentFile,
}) => {
  // 1. Upload image
  const imageUrl = await uploadFileToIPFS(imageFile);

  // 2. Upload document if provided
  let documentUrl = "";
  if (documentFile) {
    documentUrl = await uploadDocumentToIPFS(documentFile);
  }

  // 3. Create metadata JSON
  const metadata = {
    name: name || "Real Estate Property",
    description: description || "",
    image: imageUrl,
    external_url: "",
    attributes: [
      { trait_type: "Location", value: location || "Not specified" },
      { trait_type: "Property Type", value: propertyType || "Residential" },
      { trait_type: "Area (sq ft)", value: area || "N/A" },
      { trait_type: "Bedrooms", value: bedrooms || "N/A" },
      { trait_type: "Bathrooms", value: bathrooms || "N/A" },
      { trait_type: "Year Built", value: yearBuilt || "N/A" },
    ],
    // Custom real estate fields
    location: location || "",
    propertyType: propertyType || "Residential",
    area: area || "",
    documents: documentUrl,
    createdAt: new Date().toISOString(),
  };

  // 4. Upload metadata JSON to IPFS
  const metadataUrl = await uploadJSONToIPFS(metadata);

  return {
    metadataUrl,
    imageUrl,
    documentUrl,
  };
};