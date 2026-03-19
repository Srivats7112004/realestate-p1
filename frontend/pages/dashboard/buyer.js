// frontend/pages/dashboard/buyer.js
import { ethers } from "ethers";
import { useWeb3 } from "../../context/Web3Context";
import Navbar from "../../components/Navbar";
import PropertyCard from "../../components/PropertyCard";
import KYCBadge from "../../components/KYCBadge";
import { isZeroAddress } from "../../utils/helpers";

export default function BuyerDashboard() {
  const { account, provider, escrow, properties, loadBlockchainData } = useWeb3();

  const myPurchases = properties.filter(
    (p) =>
      p.buyer &&
      account &&
      !isZeroAddress(p.buyer) &&
      p.buyer.toLowerCase() === account.toLowerCase()
  );

  const availableProperties = properties.filter(
    (p) =>
      isZeroAddress(p.buyer) &&
      (!p.seller || p.seller.toLowerCase() !== account?.toLowerCase())
  );

  const handleAction = async (action, property) => {
    try {
      const signer = provider.getSigner();

      if (action === "buy") {
        const tx = await escrow
          .connect(signer)
          .depositEarnest(property.id, { value: property.purchasePrice });
        await tx.wait();
        alert("Payment deposited!");
        loadBlockchainData();
      }
    } catch (error) {
      console.error("Action failed:", error);
      alert(error?.reason || error?.message || "Action failed.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">
              🛒 Buyer Dashboard
            </h1>
            <p className="text-slate-500 mt-1">
              Browse and purchase properties
            </p>
          </div>
          <KYCBadge address={account} showRequestButton={true} />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow p-6">
            <div className="text-sm text-slate-500">My Purchases</div>
            <div className="text-3xl font-bold text-green-600">
              {myPurchases.length}
            </div>
          </div>
          <div className="bg-white rounded-xl shadow p-6">
            <div className="text-sm text-slate-500">Available Properties</div>
            <div className="text-3xl font-bold text-indigo-600">
              {availableProperties.length}
            </div>
          </div>
          <div className="bg-white rounded-xl shadow p-6">
            <div className="text-sm text-slate-500">Total Invested</div>
            <div className="text-3xl font-bold text-purple-600">
              {myPurchases
                .reduce((sum, p) => sum + parseFloat(p.price), 0)
                .toFixed(2)}{" "}
              ETH
            </div>
          </div>
        </div>

        {/* My Purchases */}
        {myPurchases.length > 0 && (
          <>
            <h2 className="text-xl font-bold text-slate-700 mb-4">
              📦 My Purchased Properties
            </h2>
            <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 mb-10">
              {myPurchases.map((property) => (
                <PropertyCard
                  key={property.id}
                  property={property}
                  onAction={handleAction}
                />
              ))}
            </div>
          </>
        )}

        {/* Available Properties */}
        <h2 className="text-xl font-bold text-slate-700 mb-4">
          🏘 Available Properties
        </h2>
        {availableProperties.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {availableProperties.map((property) => (
              <PropertyCard
                key={property.id}
                property={property}
                onAction={handleAction}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-2xl shadow">
            <p className="text-slate-500">No properties available to buy right now.</p>
          </div>
        )}
      </div>
    </div>
  );
}