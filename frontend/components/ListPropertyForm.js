import { useState } from "react";
import { ethers } from "ethers";
import { useWeb3 } from "../context/Web3Context";
import { createPropertyMetadata, uploadFileToIPFS } from "../utils/pinata";
import { ESCROW_ADDRESS, PROPERTY_TYPES } from "../utils/constants";
import KYCBadge from "./KYCBadge";

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
    <div className="bg-white rounded-2xl shadow-lg p-8 border border-purple-100">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold text-purple-700">
          📝 List New Property
        </h3>

        <label className="flex items-center gap-2 cursor-pointer">
          <span className="text-sm text-slate-500">
            {useSimpleMode ? "Simple" : "Advanced"}
          </span>
          <div
            className={`relative w-12 h-6 rounded-full transition cursor-pointer ${
              useSimpleMode ? "bg-slate-300" : "bg-purple-500"
            }`}
            onClick={() => setUseSimpleMode((prev) => !prev)}
          >
            <div
              className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                useSimpleMode ? "left-0.5" : "left-6"
              }`}
            />
          </div>
        </label>
      </div>

      <div className="mb-4">
        <KYCBadge address={account} showRequestButton={true} />
      </div>

      {linkedWallet && !canUseConnectedWallet ? (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          The connected wallet does not match the wallet linked to your profile.
          Reconnect the correct wallet before listing a property.
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Property Image *
          </label>
          <div className="flex items-start gap-4">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="flex-1 p-2 border rounded-lg text-sm"
              required
            />
            {imagePreview ? (
              <img
                src={imagePreview}
                alt="Preview"
                className="w-20 h-20 object-cover rounded-lg border"
              />
            ) : null}
          </div>
        </div>

        {!useSimpleMode ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Property Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. Luxury Villa"
                  className="w-full p-2.5 border rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location
                </label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="e.g. Mumbai, India"
                  className="w-full p-2.5 border rounded-lg text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe the property..."
                rows={3}
                className="w-full p-2.5 border rounded-lg text-sm"
              />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type
                </label>
                <select
                  name="propertyType"
                  value={formData.propertyType}
                  onChange={handleChange}
                  className="w-full p-2.5 border rounded-lg text-sm bg-white"
                >
                  {PROPERTY_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Area (sq ft)
                </label>
                <input
                  type="text"
                  name="area"
                  value={formData.area}
                  onChange={handleChange}
                  placeholder="1500"
                  className="w-full p-2.5 border rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bedrooms
                </label>
                <input
                  type="number"
                  name="bedrooms"
                  value={formData.bedrooms}
                  onChange={handleChange}
                  placeholder="3"
                  className="w-full p-2.5 border rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bathrooms
                </label>
                <input
                  type="number"
                  name="bathrooms"
                  value={formData.bathrooms}
                  onChange={handleChange}
                  placeholder="2"
                  className="w-full p-2.5 border rounded-lg text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Year Built
                </label>
                <input
                  type="text"
                  name="yearBuilt"
                  value={formData.yearBuilt}
                  onChange={handleChange}
                  placeholder="2020"
                  className="w-full p-2.5 border rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Property Document (PDF)
                </label>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => setDocumentFile(e.target.files?.[0] || null)}
                  className="w-full p-2 border rounded-lg text-sm"
                />
              </div>
            </div>
          </>
        ) : null}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Price (ETH) *
          </label>
          <input
            type="number"
            step="0.01"
            name="price"
            value={formData.price}
            onChange={handleChange}
            placeholder="e.g. 10"
            className="w-full p-2.5 border rounded-lg text-sm"
            required
          />
        </div>

        {uploadStep ? (
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3 flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-sm text-indigo-700 font-medium">
              {uploadStep}
            </span>
          </div>
        ) : null}

        <button
          type="submit"
          disabled={isUploading}
          className="w-full bg-purple-600 text-white py-3 rounded-lg font-bold hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
        >
          {isUploading ? "Processing..." : "🚀 Mint & List Property"}
        </button>
      </form>
    </div>
  );
}