import Navbar from './Navbar';
import Head from 'next/head';

export default function Layout({ children, title = 'BlockEstate' }) {
  return (
    <>
      <Head>
        <title>{title} | Blockchain Real Estate</title>
        <meta name="description" content="Decentralized Real Estate Marketplace" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100">
        <Navbar />
        <main className="animate-fadeIn">
          {children}
        </main>
        
        {/* Footer */}
        <footer className="bg-white border-t mt-20">
          <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="flex items-center space-x-2 mb-4 md:mb-0">
                <span className="text-2xl">����</span>
                <span className="text-xl font-bold text-gray-800">BlockEstate</span>
              </div>
              <div className="text-gray-500 text-sm">
                © 2024 BlockEstate. Powered by Blockchain Technology.
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}