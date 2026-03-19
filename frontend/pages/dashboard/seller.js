// frontend/pages/dashboard/seller.js
import { useWeb3 } from "../../context/Web3Context";
import Navbar from "../../components/Navbar";
import ListPropertyForm from "../../components/ListPropertyForm";
import PropertyCard from "../../components/PropertyCard";
import KYCBadge from "../../components/KYCBadge";
import { shortenAddress, formatEth } from "../../utils/helpers";

export default function SellerDashboard() {
  const { account, provider, escrow, properties, loadBlockchainData } = useWeb3();

  const myListings = properties.filter(
    (p) => p.seller && account && p.seller.toLowerCase() === account.toLowerCase()
  );

  const totalValue = myListings.reduce((sum, p) => sum + parseFloat(p.price), 0);

  const handleAction = async (action, property) => {
    try {
      const signer = provider.getSigner();

      if (action === "sell") {
        let tx = await escrow.connect(signer).approveSale(property.id);
        await tx.wait();
        tx = await escrow.connect(signer).finalizeSale(property.id);
        await tx.wait();
        alert("Sale finalized!");
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
              🏪 Seller Dashboard
            </h1>
            <p className="text-slate-500 mt-1">
              Manage your listed properties
            </p>
          </div>
          <KYCBadge address={account} showRequestButton={true} />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow p-6">
            <div className="text-sm text-slate-500">My Listings</div>
            <div className="text-3xl font-bold text-purple-600">
              {myListings.length}
            </div>
          </div>
          <div className="bg-white rounded-xl shadow p-6">
            <div className="text-sm text-slate-500">Total Value</div>
            <div className="text-3xl font-bold text-indigo-600">
              {totalValue.toFixed(2)} ETH
            </div>
          </div>
          <div className="bg-white rounded-xl shadow p-6">
            <div className="text-sm text-slate-500">Pending Sales</div>
            <div className="text-3xl font-bold text-orange-600">
              {myListings.filter((p) => p.buyerDeposited && !p.sellerApproved).length}
            </div>
          </div>
        </div>

        {/* List Form */}
        <div className="mb-10 max-w-3xl">
          <ListPropertyForm onSuccess={loadBlockchainData} />
        </div>

        {/* My Properties */}
        <h2 className="text-xl font-bold text-slate-700 mb-4">
          📋 My Listed Properties
        </h2>

        {myListings.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {myListings.map((property) => (
              <PropertyCard
                key={property.id}
                property={property}
                onAction={handleAction}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-2xl shadow">
            <div className="text-4xl mb-3">🏠</div>
            <p className="text-slate-500">
              You haven&apos;t listed any properties yet.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}