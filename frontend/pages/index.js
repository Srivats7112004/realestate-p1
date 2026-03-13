import { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { uploadFileToIPFS } from '../utils/pinata';
import RealEstateABI from '../abis/RealEstate.json';
import EscrowABI from '../abis/Escrow.json';

// --- CONTRACT ADDRESSES (UPDATE AFTER REDEPLOY) ---
const realEstateAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
const escrowAddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";

// --- ROLES ---
const inspectorAddress = "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC";
const lenderAddress = "0x90F79bf6EB2c4f870365E785982E1f101E93b906";
const governmentAddress = "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65";

export default function Home() {
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [escrow, setEscrow] = useState(null);
  const [realEstate, setRealEstate] = useState(null);

  const [properties, setProperties] = useState([]);

  const [file, setFile] = useState(null);
  const [price, setPrice] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const loadBlockchainData = async () => {
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      setProvider(provider);

      const realEstate = new ethers.Contract(realEstateAddress, RealEstateABI.abi, provider);
      setRealEstate(realEstate);

      const escrow = new ethers.Contract(escrowAddress, EscrowABI.abi, provider);
      setEscrow(escrow);

      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      if (accounts.length > 0) {
        setAccount(ethers.utils.getAddress(accounts[0]));
      }

      const totalSupply = await realEstate.totalSupply();
      const loadedProperties = [];

      for (let i = 1; i <= totalSupply.toNumber(); i++) {
        try {
          const listing = await escrow.listings(i);
          const owner = await realEstate.ownerOf(i);

          console.log(`Token #${i} owner:`, owner);

          if (listing.isListed) {
            const uri = await realEstate.tokenURI(i);

            loadedProperties.push({
              id: i,
              uri,
              image: uri,
              price: ethers.utils.formatEther(listing.purchasePrice),
              purchasePrice: listing.purchasePrice,
              escrowAmount: listing.escrowAmount,
              seller: listing.seller,
              buyer: listing.buyer,
              inspectionPassed: listing.inspectionPassed,
              lenderApproved: listing.lenderApproved,
              governmentVerified: listing.governmentVerified,
              sellerApproved: listing.sellerApproved
            });
          }
        } catch (err) {
          console.log(`No listing found for token ${i}`);
        }
      }

      setProperties(loadedProperties);

      if (window.ethereum.removeAllListeners) {
        window.ethereum.removeAllListeners('accountsChanged');
      }

      window.ethereum.on('accountsChanged', async (accounts) => {
        if (accounts.length > 0) {
          setAccount(ethers.utils.getAddress(accounts[0]));
          window.location.reload();
        }
      });
    } catch (error) {
      console.error("Load blockchain data error:", error);
    }
  };

  const connectHandler = async () => {
    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      if (accounts.length > 0) {
        setAccount(ethers.utils.getAddress(accounts[0]));
      }
    } catch (error) {
      console.error("Wallet connect failed:", error);
    }
  };

  const handleListProperty = async () => {
    if (!file || !price) {
      alert("Please select an image and set a price.");
      return;
    }

    setIsUploading(true);

    try {
      const signer = provider.getSigner();
      const signerAddress = await signer.getAddress();

      // 1. Upload image to IPFS
      console.log("Uploading image to IPFS...");
      const imageUrl = await uploadFileToIPFS(file);
      if (!imageUrl) throw new Error("IPFS upload failed");

      // 2. Mint NFT
      console.log("Minting NFT...");
      let transaction = await realEstate.connect(signer).mint(imageUrl);
      await transaction.wait();

      // 3. Get latest token ID dynamically
      const totalSupply = await realEstate.totalSupply();
      const tokenId = totalSupply.toNumber();

      // 4. Verify token ownership
      const ownerOfToken = await realEstate.ownerOf(tokenId);

      console.log("Signer address:", signerAddress);
      console.log("Owner of token:", ownerOfToken);
      console.log("Token ID:", tokenId);

      if (signerAddress.toLowerCase() !== ownerOfToken.toLowerCase()) {
        throw new Error(
          `Connected wallet (${signerAddress}) is not owner of token #${tokenId}. Actual owner is ${ownerOfToken}`
        );
      }

      // 5. Approve escrow
      console.log("Approving escrow...");
      transaction = await realEstate.connect(signer).approve(escrowAddress, tokenId);
      await transaction.wait();

      // 6. List property
      console.log("Listing property...");
      const ethPrice = ethers.utils.parseEther(price);
      const escrowAmount = ethPrice; // full payment for demo

      transaction = await escrow.connect(signer).list(tokenId, ethPrice, escrowAmount);
      await transaction.wait();

      alert(`Property #${tokenId} listed successfully!`);
      window.location.reload();
    } catch (error) {
      console.error("Listing failed:", error);
      alert(error?.reason || error?.message || "Property listing failed.");
    }

    setIsUploading(false);
  };

  const buyHandler = async (property) => {
    try {
      const signer = provider.getSigner();

      const transaction = await escrow.connect(signer).depositEarnest(property.id, {
        value: property.purchasePrice
      });

      await transaction.wait();
      alert("Payment deposited successfully!");
      window.location.reload();
    } catch (error) {
      console.error("Buy failed:", error);
      alert(error?.reason || error?.message || "Buy failed.");
    }
  };

  const inspectHandler = async (propertyId) => {
    try {
      const signer = provider.getSigner();
      const transaction = await escrow.connect(signer).updateInspectionStatus(propertyId, true);
      await transaction.wait();

      alert("Inspection approved.");
      window.location.reload();
    } catch (error) {
      console.error("Inspection failed:", error);
      alert(error?.reason || error?.message || "Inspection failed.");
    }
  };

  const lendHandler = async (propertyId) => {
    try {
      const signer = provider.getSigner();
      const transaction = await escrow.connect(signer).approveSale(propertyId);
      await transaction.wait();

      alert("Lender approved.");
      window.location.reload();
    } catch (error) {
      console.error("Lender approval failed:", error);
      alert(error?.reason || error?.message || "Lender approval failed.");
    }
  };

  const verifyHandler = async (propertyId) => {
    try {
      const signer = provider.getSigner();
      const transaction = await escrow.connect(signer).verifyProperty(propertyId);
      await transaction.wait();

      alert("Government verification complete.");
      window.location.reload();
    } catch (error) {
      console.error("Verification failed:", error);
      alert(error?.reason || error?.message || "Verification failed.");
    }
  };

  const sellHandler = async (propertyId) => {
    try {
      const signer = provider.getSigner();

      let transaction = await escrow.connect(signer).approveSale(propertyId);
      await transaction.wait();

      transaction = await escrow.connect(signer).finalizeSale(propertyId);
      await transaction.wait();

      alert("Sale completed successfully!");
      window.location.reload();
    } catch (error) {
      console.error("Finalize sale failed:", error);
      alert(error?.reason || error?.message || "Finalize sale failed.");
    }
  };

  useEffect(() => {
    if (window.ethereum) loadBlockchainData();
  }, []);

  return (
    <div className="min-h-screen bg-slate-100">
      <nav className="bg-white shadow-md px-8 py-4 flex justify-between items-center">
        <h1 className="text-3xl font-bold text-indigo-600">🏠 BlockEstate</h1>

        <div className="flex items-center gap-3">
          {account === governmentAddress && (
            <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-semibold">
              Government
            </span>
          )}
          {account === inspectorAddress && (
            <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-sm font-semibold">
              Inspector
            </span>
          )}
          {account === lenderAddress && (
            <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold">
              Lender
            </span>
          )}

          <button
            onClick={connectHandler}
            className="bg-indigo-600 text-white px-5 py-2 rounded-lg font-semibold shadow hover:bg-indigo-700"
          >
            {account ? `${account.slice(0, 6)}...${account.slice(38, 42)}` : "Connect Wallet"}
          </button>
        </div>
      </nav>

      <div className="text-center py-10">
        <h2 className="text-4xl font-bold text-slate-800">Decentralized Real Estate Marketplace</h2>
        <p className="text-slate-600 mt-2">Buy, verify, inspect, and finalize property deals on blockchain.</p>
      </div>

      {account && (
        <div className="bg-white max-w-xl mx-auto rounded-2xl shadow-lg p-8 mb-10 border border-purple-100">
          <h3 className="text-2xl font-bold text-purple-700 mb-4">List New Property</h3>

          <div className="mb-4">
            <label className="block mb-2 text-sm font-medium text-gray-700">Property Image</label>
            <input
              type="file"
              onChange={(e) => setFile(e.target.files[0])}
              className="w-full p-2 border rounded-lg"
            />
          </div>

          <div className="mb-4">
            <label className="block mb-2 text-sm font-medium text-gray-700">Price (ETH)</label>
            <input
              type="number"
              step="0.01"
              placeholder="e.g. 10"
              onChange={(e) => setPrice(e.target.value)}
              className="w-full p-2 border rounded-lg"
            />
          </div>

          <button
            onClick={handleListProperty}
            disabled={isUploading}
            className="w-full bg-purple-600 text-white py-3 rounded-lg font-bold hover:bg-purple-700"
          >
            {isUploading ? "Uploading & Minting..." : "Mint & List Property"}
          </button>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-6 pb-12">
        {properties.length > 0 ? (
          <div className="grid gap-8 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {properties.map((property) => {
              const buyerExists = property.buyer !== ethers.constants.AddressZero;
              const isSeller =
                account &&
                property.seller &&
                account.toLowerCase() === property.seller.toLowerCase();

              return (
                <div
                  key={property.id}
                  className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition"
                >
                  <img
                    src={property.image}
                    alt={`Property ${property.id}`}
                    className="w-full h-64 object-cover"
                  />

                  <div className="p-6">
                    <h3 className="text-2xl font-bold text-slate-800 mb-2">
                      Property #{property.id}
                    </h3>
                    <p className="text-lg text-slate-600 mb-2">
                      Price: <span className="font-bold text-indigo-600">{property.price} ETH</span>
                    </p>
                    <p className="text-sm text-slate-500 mb-4">
                      Seller: {property.seller.slice(0, 6)}...{property.seller.slice(38, 42)}
                    </p>

                    <div className="bg-slate-50 rounded-xl p-4 space-y-2 text-sm text-slate-700 mb-4">
                      <p>🏛 Government Verified: {property.governmentVerified ? "✅" : "⏳"}</p>
                      <p>🔍 Inspection Passed: {property.inspectionPassed ? "✅" : "⏳"}</p>
                      <p>💰 Lender Approved: {property.lenderApproved ? "✅" : "⏳"}</p>
                      <p>🧾 Buyer Deposited: {buyerExists ? "✅" : "⏳"}</p>
                    </div>

                    {account === governmentAddress ? (
                      <button
                        onClick={() => verifyHandler(property.id)}
                        disabled={property.governmentVerified}
                        className="w-full bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 disabled:bg-gray-400"
                      >
                        {property.governmentVerified ? "Verified" : "Verify Ownership"}
                      </button>
                    ) : account === inspectorAddress ? (
                      <button
                        onClick={() => inspectHandler(property.id)}
                        disabled={property.inspectionPassed}
                        className="w-full bg-orange-500 text-white py-3 rounded-lg font-semibold hover:bg-orange-600 disabled:bg-gray-400"
                      >
                        {property.inspectionPassed ? "Inspection Passed" : "Pass Inspection"}
                      </button>
                    ) : account === lenderAddress ? (
                      <button
                        onClick={() => lendHandler(property.id)}
                        disabled={property.lenderApproved}
                        className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400"
                      >
                        {property.lenderApproved ? "Loan Approved" : "Approve Loan"}
                      </button>
                    ) : isSeller ? (
                      <button
                        onClick={() => sellHandler(property.id)}
                        className="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700"
                      >
                        Finalize Sale
                      </button>
                    ) : (
                      <button
                        onClick={() => buyHandler(property)}
                        disabled={buyerExists}
                        className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 disabled:bg-gray-400"
                      >
                        {buyerExists ? "Buyer Funded" : "Buy Property"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center text-slate-500 text-xl">No properties listed yet.</div>
        )}
      </div>
    </div>
  );
}