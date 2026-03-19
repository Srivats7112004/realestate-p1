import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import Layout from '../../components/Layout';
import { useWeb3 } from '../../context/Web3Context';
import { useRouter } from 'next/router';

export default function LenderDashboard() {
  const { account, signer, realEstate, escrow, isInitialized, ROLES } = useWeb3();
  const router = useRouter();
  
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [processingId, setProcessingId] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    approved: 0,
    pending: 0,
    totalValue: '0'
  });

  const loadProperties = useCallback(async () => {
    if (!realEstate || !escrow) return;

    setLoading(true);
    try {
      const totalSupply = await realEstate.totalSupply();
      const props = [];
      let totalVal = ethers.BigNumber.from(0);

      for (let i = 1; i <= totalSupply.toNumber(); i++) {
        try {
          const listing = await escrow.listings(i);
          
          if (listing.isListed) {
            const uri = await realEstate.tokenURI(i);
            props.push({
              id: i,
              uri,
              image: uri,
              price: ethers.utils.formatEther(listing.purchasePrice),
              purchasePrice: listing.purchasePrice,
              seller: listing.seller,
              buyer: listing.buyer,
              governmentVerified: listing.governmentVerified,
              inspectionPassed: listing.inspectionPassed,
              lenderApproved: listing.lenderApproved
            });

            if (listing.lenderApproved) {
              totalVal = totalVal.add(listing.purchasePrice);
            }
          }
        } catch (err) {
          // Skip
        }
      }

      setProperties(props);
      setStats({
        total: props.length,
        approved: props.filter(p => p.lenderApproved).length,
        pending: props.filter(p => !p.lenderApproved).length,
        totalValue: ethers.utils.formatEther(totalVal)
      });
    } catch (error) {
      console.error("Error loading properties:", error);
    }
    setLoading(false);
  }, [realEstate, escrow]);

  useEffect(() => {
    if (isInitialized) {
      if (!account) {
        router.push('/login');
      } else if (account.toLowerCase() !== ROLES.lender.toLowerCase()) {
        alert("Access denied. Lender role required.");
        router.push('/dashboard');
      } else if (realEstate && escrow) {
        loadProperties();
      }
    }
  }, [isInitialized, account, realEstate, escrow, router, ROLES.lender, loadProperties]);

  const handleApproveLoan = async (propertyId) => {
    setProcessingId(propertyId);
    try {
      const tx = await escrow.connect(signer).approveSale(propertyId);
      await tx.wait();
      alert(`✅ Loan approved for Property #${propertyId}!`);
      loadProperties();
    } catch (error) {
      console.error("Loan approval failed:", error);
      alert(error?.reason || error?.message || "Loan approval failed.");
    }
    setProcessingId(null);
  };

  const filteredProperties = properties.filter(p => {
    if (filter === 'pending') return !p.lenderApproved;
    if (filter === 'approved') return p.lenderApproved;
    return true;
  });

  return (
    <Layout title="Lender Dashboard">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              💰 Loan Approval Portal
            </h1>
            <p className="text-gray-600">
              Review and approve property loans
            </p>
          </div>
          <div className="mt-4 md:mt-0">
            <span className="bg-blue-100 text-blue-700 px-4 py-2 rounded-full font-medium">
              💳 Licensed Lender
            </span>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Requests</p>
                <p className="text-3xl font-bold text-gray-800">{stats.total}</p>
              </div>
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-2xl">
                📊
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Pending</p>
                <p className="text-3xl font-bold text-amber-600">{stats.pending}</p>
              </div>
              <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center text-2xl">
                ⏳
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Approved</p>
                <p className="text-3xl font-bold text-emerald-600">{stats.approved}</p>
              </div>
              <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center text-2xl">
                ✅
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Value</p>
                <p className="text-2xl font-bold text-blue-600">{parseFloat(stats.totalValue).toFixed(2)} ETH</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-2xl">
                💎
              </div>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex space-x-1 mb-8 bg-gray-100 rounded-xl p-1 max-w-md">
          {[
            { id: 'pending', label: '⏳ Pending', count: stats.pending },
            { id: 'approved', label: '✅ Approved', count: stats.approved },
            { id: 'all', label: '📋 All', count: stats.total }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
                filter === tab.id
                  ? 'bg-white text-blue-600 shadow'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        {/* Loan Requests Table */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="text-center">
              <svg className="animate-spin h-12 w-12 text-blue-600 mx-auto mb-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <p className="text-gray-500">Loading loan requests...</p>
            </div>
          </div>
        ) : filteredProperties.length > 0 ? (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Property</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Amount</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Buyer</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Verifications</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Status</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredProperties.map((property) => (
                    <tr key={property.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <img
                            src={property.image}
                            alt={`Property ${property.id}`}
                            className="w-12 h-12 rounded-lg object-cover"
                            onError={(e) => {
                              e.target.src = 'https://via.placeholder.com/48x48?text=P';
                            }}
                          />
                          <div>
                            <p className="font-semibold text-gray-800">Property #{property.id}</p>
                            <p className="text-sm text-gray-500">
                              {property.seller.slice(0, 6)}...{property.seller.slice(-4)}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-bold text-indigo-600">{property.price} ETH</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-600">
                          {property.buyer === ethers.constants.AddressZero 
                            ? <span className="text-gray-400">No buyer yet</span>
                            : `${property.buyer.slice(0, 6)}...${property.buyer.slice(-4)}`}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            property.governmentVerified 
                              ? 'bg-emerald-100 text-emerald-700' 
                              : 'bg-gray-100 text-gray-500'
                          }`}>
                            🏛️ {property.governmentVerified ? '✓' : '✗'}
                          </span>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            property.inspectionPassed 
                              ? 'bg-emerald-100 text-emerald-700' 
                              : 'bg-gray-100 text-gray-500'
                          }`}>
                            🔍 {property.inspectionPassed ? '✓' : '✗'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                          property.lenderApproved 
                            ? 'bg-emerald-100 text-emerald-700' 
                            : 'bg-amber-100 text-amber-700'
                        }`}>
                          {property.lenderApproved ? '✅ Approved' : '⏳ Pending'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {!property.lenderApproved && (
                          <button
                            onClick={() => handleApproveLoan(property.id)}
                            disabled={processingId === property.id}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium 
                                     hover:bg-blue-700 transition disabled:opacity-50 text-sm
                                     flex items-center space-x-1"
                          >
                            {processingId === property.id ? (
                              <>
                                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                                <span>...</span>
                              </>
                            ) : (
                              <>
                                <span>💰</span>
                                <span>Approve</span>
                              </>
                            )}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-2xl shadow-lg">
            <div className="text-6xl mb-4">💳</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              No Loan Requests Found
            </h3>
            <p className="text-gray-600">
              {filter === 'pending' 
                ? 'No pending loan requests' 
                : 'No loan requests to display'}
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
}