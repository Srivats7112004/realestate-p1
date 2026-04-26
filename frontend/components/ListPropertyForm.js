import { useState } from "react";
import { ethers } from "ethers";
import { useWeb3 } from "../context/Web3Context";
import { createPropertyMetadata, uploadFileToIPFS } from "../utils/pinata";
import { ESCROW_ADDRESS, PROPERTY_TYPES } from "../utils/constants";
import KYCBadge from "./KYCBadge";

function FieldLabel({ children, required = false, helper }) {
  return (
    <div className="mb-2">
      <label className="block text-sm font-semibold text-slate-700">
        {children} {required ? <span className="text-red-500">*</span> : null}
      </label>
      {helper ? <p className="mt-1 text-xs text-slate-500">{helper}</p> : null}
    </div>
  );
}

function Input({ className = "", ...props }) {
  return (
    <input
      {...props}
      className={`w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100 ${className}`}
    />
  );
}

function Textarea({ className = "", ...props }) {
  return (
    <textarea
      {...props}
      className={`w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100 ${className}`}
    />
  );
}

function Select({ className = "", children, ...props }) {
  return (
    <select
      {...props}
      className={`w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100 ${className}`}
    >
      {children}
    </select>
  );
}

export default function ListPropertyForm({ onSuccess }) {
  const {
    account,
    provider,
    realEstate,
    escrow,
    userRole,
    canUseConnectedWallet,
    linkedWallet,
    loadBlockchainData,
  } = useWeb3();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    location: "",
    propertyType: "Residential",
    area: "",
    bedrooms: "",
    bathrooms: "",
    yearBuilt: "",
    price: "",
  });

  const [imageFile, setImageFile] = useState(null);
  const [documentFile, setDocumentFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStep, setUploadStep] = useState("");
  const [useSimpleMode, setUseSimpleMode] = useState(false);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageFile(file);

    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      location: "",
      propertyType: "Residential",
      area: "",
      bedrooms: "",
      bathrooms: "",
      yearBuilt: "",
      price: "",
    });
    setImageFile(null);
    setDocumentFile(null);
    setImagePreview(null);
  };

  const extractTokenIdFromReceipt = async (receipt, contract) => {
    const contractAddress = contract.address?.toLowerCase?.();

    const eventMatch = (receipt?.events || []).find((event) => {
      return (
        event?.event === "Transfer" &&
        event?.address?.toLowerCase?.() === contractAddress
      );
    });

    const tokenFromEvent = eventMatch?.args?.tokenId ?? eventMatch?.args?.[2];
    if (tokenFromEvent) {
      return tokenFromEvent.toString();
    }

    for (const log of receipt?.logs || []) {
      try {
        const parsed = contract.interface.parseLog(log);
        if (parsed?.name === "Transfer") {
          const tokenId = parsed.args?.tokenId ?? parsed.args?.[2];
          if (tokenId) {
            return tokenId.toString();
          }
        }
      } catch {
        // Ignore unrelated logs
      }
    }

    try {
      const latestTokenId = await contract.totalSupply();
      if (latestTokenId && latestTokenId.toString() !== "0") {
        return latestTokenId.toString();
      }
    } catch {
      // Ignore fallback failure
    }

    return null;
  };

  const validateBeforeSubmit = () => {
    if (userRole === "guest") {
      throw new Error("Please log in before listing a property.");
    }

    if (userRole !== "user" && userRole !== "admin") {
      throw new Error(
        "Only normal users can list properties from this form. Special roles should use their dashboard workflows."
      );
    }

    if (!account || !provider || !realEstate || !escrow) {
      throw new Error("Please connect MetaMask before listing.");
    }

    if (linkedWallet && !canUseConnectedWallet) {
      throw new Error(
        "The connected wallet does not match the wallet linked to your profile. Please reconnect the correct wallet."
      );
    }

    if (!imageFile) {
      throw new Error("Please upload a property image.");
    }

    if (!formData.price || Number(formData.price) <= 0) {
      throw new Error("Please enter a valid price.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      validateBeforeSubmit();
      setIsUploading(true);

      const signer = provider.getSigner();
      const signerAddress = await signer.getAddress();

      let tokenURI = "";

      if (useSimpleMode) {
        setUploadStep("Uploading image to IPFS...");
        tokenURI = await uploadFileToIPFS(imageFile);
      } else {
        setUploadStep("Uploading image & metadata to IPFS...");
        const result = await createPropertyMetadata({
          name: formData.name || "Untitled Property",
          description: formData.description,
          imageFile,
          location: formData.location,
          propertyType: formData.propertyType,
          area: formData.area,
          bedrooms: formData.bedrooms,
          bathrooms: formData.bathrooms,
          yearBuilt: formData.yearBuilt,
          documentFile,
        });

        tokenURI = result?.metadataUrl || "";
      }

      if (!tokenURI) {
        throw new Error("IPFS upload failed. No token URI returned.");
      }

      setUploadStep("Minting NFT on blockchain...");
      const mintTx = await realEstate.connect(signer).mint(tokenURI);
      const mintReceipt = await mintTx.wait();

      const tokenId = await extractTokenIdFromReceipt(mintReceipt, realEstate);

      if (!tokenId) {
        throw new Error(
          "Could not determine minted token ID from transaction receipt."
        );
      }

      setUploadStep("Verifying ownership...");
      const ownerOfToken = await realEstate.ownerOf(tokenId);

      if (ownerOfToken.toLowerCase() !== signerAddress.toLowerCase()) {
        throw new Error("Ownership verification failed after minting.");
      }

      setUploadStep("Approving escrow contract...");
      const approveTx = await realEstate
        .connect(signer)
        .approve(ESCROW_ADDRESS, tokenId);
      await approveTx.wait();

      setUploadStep("Listing property on marketplace...");
      const ethPrice = ethers.utils.parseEther(String(formData.price));
      const listTx = await escrow.connect(signer).list(tokenId, ethPrice, ethPrice);
      await listTx.wait();

      setUploadStep("Refreshing blockchain data...");
      await loadBlockchainData(false);

      alert(`Property #${tokenId} listed successfully!`);
      resetForm();

      if (onSuccess) {
        await onSuccess();
      }
    } catch (error) {
      console.error("Listing failed:", error);
      alert(error?.reason || error?.message || "Property listing failed.");
    } finally {
      setIsUploading(false);
      setUploadStep("");
    }
  };

  return (
    <div className="surface-card-strong overflow-hidden">
      <div className="border-b border-slate-200 bg-gradient-to-r from-sky-50 to-cyan-50 px-6 py-6 md:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="page-kicker mb-3">
              <span className="page-dot" />
              Seller listing workflow
            </div>
            <h3 className="text-2xl font-bold tracking-tight text-slate-900">
              List a New Property
            </h3>
            <p className="mt-2 max-w-2xl text-sm text-slate-600">
              Upload your property details, mint the asset as an NFT, approve the escrow contract,
              and publish it to the marketplace in one guided flow.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <div className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
              Listing Mode
            </div>

            <button
              type="button"
              onClick={() => setUseSimpleMode((prev) => !prev)}
              className="flex items-center gap-3"
            >
              <span
                className={`text-sm font-semibold ${
                  useSimpleMode ? "text-slate-500" : "text-sky-700"
                }`}
              >
                Advanced
              </span>

              <div
                className={`relative h-7 w-14 rounded-full transition ${
                  useSimpleMode ? "bg-slate-300" : "bg-sky-500"
                }`}
              >
                <div
                  className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                    useSimpleMode ? "left-1" : "translate-x-7 left-1"
                  }`}
                />
              </div>

              <span
                className={`text-sm font-semibold ${
                  useSimpleMode ? "text-sky-700" : "text-slate-500"
                }`}
              >
                Simple
              </span>
            </button>
          </div>
        </div>
      </div>

      <div className="px-6 py-6 md:px-8 md:py-8">
        <div className="mb-6">
          <KYCBadge address={account} showRequestButton={true} />
        </div>

        {linkedWallet && !canUseConnectedWallet ? (
          <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-800">
            <div className="font-semibold">Wallet mismatch detected</div>
            <div className="mt-1">
              The connected wallet does not match the wallet linked to your profile.
              Reconnect the correct wallet before listing a property.
            </div>
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Media upload */}
          <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5 md:p-6">
            <div className="mb-5">
              <h4 className="text-lg font-bold text-slate-900">Property Media</h4>
              <p className="mt-1 text-sm text-slate-500">
                Upload the main property image and optionally attach supporting documents.
              </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
              <div>
                <FieldLabel
                  required
                  helper="Use a clear property image. This will be shown across the marketplace."
                >
                  Property Image
                </FieldLabel>

                <label className="flex min-h-[180px] cursor-pointer flex-col items-center justify-center rounded-[1.25rem] border-2 border-dashed border-slate-300 bg-white px-6 py-8 text-center transition hover:border-sky-400 hover:bg-sky-50/30">
                  <div className="mb-3 text-4xl">🖼️</div>
                  <div className="text-sm font-semibold text-slate-700">
                    {imageFile ? imageFile.name : "Click to upload property image"}
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    PNG, JPG, WEBP and other image formats
                  </div>

                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                    required
                  />
                </label>
              </div>

              <div>
                <div className="mb-2 text-sm font-semibold text-slate-700">
                  Image Preview
                </div>

                <div className="overflow-hidden rounded-[1.25rem] border border-slate-200 bg-white">
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="h-[180px] w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-[180px] items-center justify-center bg-slate-50 text-sm text-slate-400">
                      No image selected yet
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Advanced details */}
          {!useSimpleMode ? (
            <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 md:p-6">
              <div className="mb-5">
                <h4 className="text-lg font-bold text-slate-900">Property Details</h4>
                <p className="mt-1 text-sm text-slate-500">
                  Add richer metadata so the property looks more professional inside the marketplace.
                </p>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <FieldLabel helper="A short title for the property card and detail page.">
                    Property Name
                  </FieldLabel>
                  <Input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g. Luxury Villa in Hyderabad"
                  />
                </div>

                <div>
                  <FieldLabel helper="City, area, or full property location.">
                    Location
                  </FieldLabel>
                  <Input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    placeholder="e.g. Gachibowli, Hyderabad"
                  />
                </div>
              </div>

              <div className="mt-5">
                <FieldLabel helper="Describe the property, condition, highlights, and key selling points.">
                  Description
                </FieldLabel>
                <Textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Describe the property..."
                  rows={4}
                />
              </div>

              <div className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
                <div>
                  <FieldLabel>Property Type</FieldLabel>
                  <Select
                    name="propertyType"
                    value={formData.propertyType}
                    onChange={handleChange}
                  >
                    {PROPERTY_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </Select>
                </div>

                <div>
                  <FieldLabel>Area (sq ft)</FieldLabel>
                  <Input
                    type="text"
                    name="area"
                    value={formData.area}
                    onChange={handleChange}
                    placeholder="1500"
                  />
                </div>

                <div>
                  <FieldLabel>Bedrooms</FieldLabel>
                  <Input
                    type="number"
                    name="bedrooms"
                    value={formData.bedrooms}
                    onChange={handleChange}
                    placeholder="3"
                  />
                </div>

                <div>
                  <FieldLabel>Bathrooms</FieldLabel>
                  <Input
                    type="number"
                    name="bathrooms"
                    value={formData.bathrooms}
                    onChange={handleChange}
                    placeholder="2"
                  />
                </div>
              </div>

              <div className="mt-5 grid gap-5 md:grid-cols-2">
                <div>
                  <FieldLabel>Year Built</FieldLabel>
                  <Input
                    type="text"
                    name="yearBuilt"
                    value={formData.yearBuilt}
                    onChange={handleChange}
                    placeholder="2020"
                  />
                </div>

                <div>
                  <FieldLabel helper="Optional: upload a PDF or supporting document.">
                    Property Document
                  </FieldLabel>
                  <Input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => setDocumentFile(e.target.files?.[0] || null)}
                    className="file:mr-4 file:rounded-xl file:border-0 file:bg-sky-50 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-sky-700"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-[1.5rem] border border-sky-200 bg-sky-50 px-5 py-4 text-sm text-sky-800">
              <div className="font-semibold">Simple mode enabled</div>
              <div className="mt-1">
                Only the image and price are required. Metadata will be kept minimal for quicker listing.
              </div>
            </div>
          )}

          {/* Pricing */}
          <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5 md:p-6">
            <div className="mb-5">
              <h4 className="text-lg font-bold text-slate-900">Pricing</h4>
              <p className="mt-1 text-sm text-slate-500">
                Set the listing price in ETH. This value is also used for escrow listing in your current flow.
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-[1fr_260px]">
              <div>
                <FieldLabel required helper="Enter the property listing price in ETH.">
                  Price (ETH)
                </FieldLabel>
                <Input
                  type="number"
                  step="0.01"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  placeholder="e.g. 10"
                  required
                />
              </div>

              <div className="rounded-[1.25rem] border border-slate-200 bg-white p-4">
                <div className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                  Workflow Summary
                </div>
                <div className="space-y-2 text-sm text-slate-600">
                  <div>1. Upload to IPFS</div>
                  <div>2. Mint property NFT</div>
                  <div>3. Approve escrow contract</div>
                  <div>4. Publish listing on-chain</div>
                </div>
              </div>
            </div>
          </div>

          {/* Progress */}
          {uploadStep ? (
            <div className="rounded-[1.5rem] border border-sky-200 bg-sky-50 px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="h-5 w-5 rounded-full border-2 border-sky-500 border-t-transparent animate-spin" />
                <div>
                  <div className="text-sm font-semibold text-sky-800">
                    Processing listing
                  </div>
                  <div className="text-sm text-sky-700">{uploadStep}</div>
                </div>
              </div>
            </div>
          ) : null}

          {/* Actions */}
          <div className="flex flex-col gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-500">
              Once submitted, the property will be minted and listed through the connected wallet.
            </p>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={resetForm}
                disabled={isUploading}
                className="secondary-btn px-5 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-50"
              >
                Reset Form
              </button>

              <button
                type="submit"
                disabled={isUploading}
                className="primary-btn px-6 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isUploading ? "Processing..." : "Mint & List Property"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}