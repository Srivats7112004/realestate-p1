import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import { useWeb3 } from '../context/Web3Context';

export default function Login() {
  const { account, connectWallet, isConnecting, userRole } = useWeb3();
  const router = useRouter();

  useEffect(() => {
    if (account) {
      router.push('/dashboard');
    }
  }, [account, router]);

  const handleConnect = async () => {
    const success = await connectWallet();
    if (success) {
      router.push('/dashboard');
    }
  };

  const walletOptions = [
    {
      name: 'MetaMask',
      icon: '🦊',
      description: 'Connect using MetaMask browser extension',
      popular: true
    },
    {
      name: 'WalletConnect',
      icon: '🔗',
      description: 'Scan QR code with your mobile wallet',
      comingSoon: true
    },
    {
      name: 'Coinbase Wallet',
      icon: '💰',
      description: 'Connect using Coinbase Wallet',
      comingSoon: true
    }
  ];

  const roles = [
    { name: 'Buyer', icon: '🛒', description: 'Browse and purchase properties' },
    { name: 'Seller', icon: '🏠', description: 'List and sell your properties' },
    { name: 'Government', icon: '🏛️', description: 'Verify property ownership' },
    { name: 'Inspector', icon: '🔍', description: 'Inspect and approve properties' },
    { name: 'Lender', icon: '💳', description: 'Approve loans for buyers' }
  ];

  return (
    <Layout title="Login">
      <div className="min-h-[calc(100vh-200px)] flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">🔐</div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              Connect Your Wallet
            </h1>
            <p className="text-gray-600">
              Choose your preferred wallet to access BlockEstate
            </p>
          </div>

          {/* Wallet Options */}
          <div className="space-y-4 mb-8">
            {walletOptions.map((wallet, index) => (
              <button
                key={index}
                onClick={wallet.comingSoon ? null : handleConnect}
                disabled={isConnecting || wallet.comingSoon}
                className={`w-full bg-white rounded-xl p-4 border-2 transition-all duration-300 
                          flex items-center justify-between group
                          ${wallet.comingSoon 
                            ? 'border-gray-200 opacity-60 cursor-not-allowed' 
                            : 'border-gray-200 hover:border-indigo-500 hover:shadow-lg cursor-pointer'}`}
              >
                <div className="flex items-center space-x-4">
                  <span className="text-3xl">{wallet.icon}</span>
                  <div className="text-left">
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-gray-800">{wallet.name}</span>
                      {wallet.popular && (
                        <span className="bg-indigo-100 text-indigo-600 text-xs px-2 py-0.5 rounded-full">
                          Popular
                        </span>
                      )}
                      {wallet.comingSoon && (
                        <span className="bg-gray-100 text-gray-500 text-xs px-2 py-0.5 rounded-full">
                          Coming Soon
                        </span>
                      )}
                    </div>
                    <span className="text-sm text-gray-500">{wallet.description}</span>
                  </div>
                </div>
                {!wallet.comingSoon && (
                  <svg 
                    className="w-5 h-5 text-gray-400 group-hover:text-indigo-600 transition" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                )}
              </button>
            ))}
          </div>

          {/* Loading State */}
          {isConnecting && (
            <div className="bg-indigo-50 rounded-xl p-4 mb-8 flex items-center justify-center space-x-3">
              <svg className="animate-spin h-5 w-5 text-indigo-600" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span className="text-indigo-600 font-medium">Connecting to wallet...</span>
            </div>
          )}

          {/* Roles Info */}
          <div className="bg-gray-50 rounded-xl p-6">
            <h3 className="font-semibold text-gray-800 mb-4 text-center">
              Platform Roles
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {roles.map((role, index) => (
                <div key={index} className="flex items-center space-x-2 text-sm">
                  <span>{role.icon}</span>
                  <span className="text-gray-600">{role.name}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-4 text-center">
              Your role is automatically detected based on your wallet address
            </p>
          </div>

          {/* Help Link */}
          <p className="text-center text-sm text-gray-500 mt-6">
            New to crypto wallets?{' '}
            <a 
              href="https://metamask.io/download/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-indigo-600 hover:underline"
            >
              Install MetaMask
            </a>
          </p>
        </div>
      </div>
    </Layout>
  );
}