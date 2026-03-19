import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useWeb3 } from "../context/Web3Context";

const stats = [
  { value: "ERC-721", label: "Property ownership model" },
  { value: "IPFS", label: "Metadata & image storage" },
  { value: "5 Roles", label: "Approval participants" },
  { value: "Escrow", label: "Transaction settlement logic" },
];

const featureCards = [
  {
    title: "Secure Property Ownership",
    desc: "Each listed property is minted as a unique NFT, creating a traceable and tamper-resistant ownership record.",
  },
  {
    title: "Escrow-Based Transactions",
    desc: "Funds are locked in escrow and released only after the required approvals and sale conditions are completed.",
  },
  {
    title: "Multi-Party Verification",
    desc: "Government authority, inspector, lender, buyer, and seller participate in a structured transaction workflow.",
  },
  {
    title: "Decentralized Record Storage",
    desc: "Property images and metadata are stored on IPFS for reliable and transparent asset referencing.",
  },
  {
    title: "Marketplace Experience",
    desc: "Browse multiple tokenized properties, view status, and interact with listings through a modern interface.",
  },
  {
    title: "Wallet-Native Access",
    desc: "Users connect using MetaMask and perform contract actions directly through the application.",
  },
];

const workflowSteps = [
  {
    step: "01",
    title: "Connect Wallet",
    desc: "The user connects a wallet to access the marketplace and interact with smart contracts.",
  },
  {
    step: "02",
    title: "Mint Property NFT",
    desc: "The seller uploads property information and mints the asset as an ERC-721 property NFT.",
  },
  {
    step: "03",
    title: "List Through Escrow",
    desc: "The property is listed for sale and linked to the escrow workflow for transaction security.",
  },
  {
    step: "04",
    title: "Buyer Deposits Funds",
    desc: "The buyer commits funds into escrow, establishing a secure transaction state.",
  },
  {
    step: "05",
    title: "Approvals Are Completed",
    desc: "Inspector, lender, and government authority complete the required checks and approvals.",
  },
  {
    step: "06",
    title: "Ownership Transfers",
    desc: "The NFT is transferred to the buyer and payment is released to the seller.",
  },
];

const builtItems = [
  "NFT minting for properties",
  "Escrow-based smart contract workflow",
  "Multi-role approval process",
  "Multi-property marketplace support",
  "IPFS image upload integration",
  "Wallet-based interaction",
  "Dynamic role handling on frontend",
  "Deployment scripts and ABI integration",
];

const roadmapItems = [
  "Rich property metadata with title, location, and document CID",
  "Advanced search and filtering by seller, price, and status",
  "Role-specific dashboards for buyer, seller, and verifier",
  "KYC / AML simulation layer",
  "Testnet deployment on Sepolia or Polygon Amoy",
  "Improved documentation and architecture diagrams",
];

export default function LandingPage() {
  const router = useRouter();
  const { connectWallet, account } = useWeb3();
  const [isConnecting, setIsConnecting] = useState(false);
  const [visible, setVisible] = useState({});

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible((prev) => ({
              ...prev,
              [entry.target.id]: true,
            }));
          }
        });
      },
      { threshold: 0.14 }
    );

    const sections = document.querySelectorAll("[data-section]");
    sections.forEach((section) => observer.observe(section));

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (account && isConnecting) {
      setIsConnecting(false);
      router.push("/");
    }
  }, [account, isConnecting, router]);

  const handleConnect = async () => {
    try {
      setIsConnecting(true);
      await connectWallet();
    } catch (error) {
      console.error("Wallet connection failed:", error);
      setIsConnecting(false);
    }
  };

  const sectionClass = (id) =>
    `reveal-section ${visible[id] ? "is-visible" : ""}`;

  return (
    <div className="min-h-screen bg-[#F7FAFC] text-[#0F172A]">
      {/* NAVBAR */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 fade-in-down">
            <div className="w-10 h-10 rounded-xl bg-sky-600 flex items-center justify-center shadow-sm transition-transform duration-300 hover:scale-[1.03]">
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0h6"
                />
              </svg>
            </div>
            <div>
              <div className="text-lg font-semibold tracking-tight">BlockEstate</div>
              <div className="text-xs text-slate-500">
                Blockchain Real Estate Marketplace MVP
              </div>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm fade-in-down delay-1">
            <a href="#features" className="text-slate-600 hover:text-slate-900 transition-colors nav-link">
              Features
            </a>
            <a href="#workflow" className="text-slate-600 hover:text-slate-900 transition-colors nav-link">
              Workflow
            </a>
            <a href="#built" className="text-slate-600 hover:text-slate-900 transition-colors nav-link">
              What’s Built
            </a>
            <a href="#roadmap" className="text-slate-600 hover:text-slate-900 transition-colors nav-link">
              Roadmap
            </a>
          </div>

          <div className="flex items-center gap-3 fade-in-down delay-2">
            <button
              onClick={() => router.push("/")}
              className="hidden sm:inline-flex px-4 py-2 rounded-lg border border-slate-300 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:shadow-sm transition-all duration-300"
            >
              View Demo
            </button>
            <button
              onClick={handleConnect}
              disabled={isConnecting}
              className="px-5 py-2.5 rounded-lg bg-sky-600 text-white text-sm font-medium hover:bg-sky-700 hover:shadow-md transition-all duration-300 disabled:opacity-60"
            >
              {isConnecting ? "Connecting..." : account ? "Launch App" : "Connect Wallet"}
            </button>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="pt-20 pb-16 bg-white border-b border-slate-200 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-14 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-sky-50 text-sky-700 border border-sky-100 text-sm font-medium mb-6 hero-reveal delay-1">
              <span className="w-2 h-2 rounded-full bg-sky-600 pulse-dot"></span>
              Escrow workflow • NFT ownership • IPFS-backed records
            </div>

            <h1 className="text-5xl md:text-6xl font-bold tracking-tight leading-tight mb-6 text-slate-900">
              <span className="hero-reveal delay-2 block">Secure property transactions with</span>
              <span className="hero-reveal delay-3 block text-sky-700">
                onchain ownership and escrow
              </span>
            </h1>

            <p className="text-lg text-slate-600 leading-relaxed max-w-2xl mb-8 hero-reveal delay-4">
              BlockEstate is a blockchain-based real estate marketplace MVP designed to
              improve transparency in property listing, approval, and transfer workflows.
              It combines NFT-based ownership, smart contract escrow, and IPFS-backed asset storage.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-10 hero-reveal delay-5">
              <button
                onClick={() => router.push("/")}
                className="px-7 py-4 rounded-xl bg-sky-600 text-white font-semibold hover:bg-sky-700 hover:shadow-md transition-all duration-300 shadow-sm hover:-translate-y-[1px]"
              >
                View Live Demo
              </button>
              <button
                onClick={() => window.open("https://github.com", "_blank")}
                className="px-7 py-4 rounded-xl border border-slate-300 bg-white text-slate-800 font-semibold hover:bg-slate-50 hover:shadow-sm transition-all duration-300 hover:-translate-y-[1px]"
              >
                View Smart Contracts
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 hero-reveal delay-6">
              {stats.map((item, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4 stat-card"
                >
                  <div className="text-sky-700 font-semibold text-sm mb-1">{item.value}</div>
                  <div className="text-xs text-slate-500 leading-relaxed">{item.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="hero-panel-enter">
            <div className="relative">
              <div className="absolute -inset-4 rounded-[2rem] bg-sky-100/70 blur-3xl hero-glow"></div>

              <div className="relative rounded-3xl border border-slate-200 bg-white shadow-xl overflow-hidden hero-card">
                <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold text-slate-900">
                      Property Transaction Overview
                    </div>
                    <div className="text-xs text-slate-500">
                      Approval-based marketplace workflow
                    </div>
                  </div>
                  <div className="px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Active Escrow
                  </div>
                </div>

                <div className="p-6">
                  <div className="rounded-2xl overflow-hidden border border-slate-200 mb-6 image-slide-up">
                    <img
                      src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200"
                      alt="Property preview"
                      className="w-full h-64 object-cover transition-transform duration-700 hover:scale-[1.03]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    {[
                      ["Asset Type", "Property NFT"],
                      ["Settlement", "Escrow Contract"],
                      ["Record Storage", "IPFS / Pinata"],
                      ["Participants", "Buyer • Seller • Verifiers"],
                    ].map((item, idx) => (
                      <div
                        key={idx}
                        className={`rounded-xl border border-slate-200 p-4 bg-slate-50 hover:shadow-sm transition-all duration-300 hover:-translate-y-0.5 slide-up-card`}
                        style={{ animationDelay: `${0.15 + idx * 0.08}s` }}
                      >
                        <div className="text-xs text-slate-500 mb-1">{item[0]}</div>
                        <div className="font-semibold text-slate-900">{item[1]}</div>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 progress-slide-up">
                    <div className="text-sm font-semibold text-slate-900 mb-4">
                      Transaction Progress
                    </div>
                    <div className="space-y-3">
                      {[
                        { label: "Property listed and minted", status: "Completed" },
                        { label: "Buyer funds deposited", status: "Completed" },
                        { label: "Inspector and lender approvals", status: "In progress" },
                        { label: "Government verification", status: "Pending" },
                      ].map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between gap-3 progress-row"
                          style={{ animationDelay: `${0.45 + idx * 0.08}s` }}
                        >
                          <div className="flex items-center gap-3">
                            <span
                              className={`w-2.5 h-2.5 rounded-full ${
                                item.status === "Completed"
                                  ? "bg-emerald-500"
                                  : item.status === "In progress"
                                  ? "bg-sky-600"
                                  : "bg-slate-400"
                              }`}
                            ></span>
                            <span className="text-sm text-slate-700">{item.label}</span>
                          </div>
                          <span className="text-xs text-slate-500">{item.status}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TRUST STRIP */}
      <section className="py-8 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-4 gap-6 text-center">
          {[
            "Structured approval workflow",
            "Transparent ownership trail",
            "Escrow-based sale execution",
            "Blockchain-backed record keeping",
          ].map((item, idx) => (
            <div
              key={idx}
              className="text-sm font-medium text-slate-700 slide-fade-in"
              style={{ animationDelay: `${idx * 0.08}s` }}
            >
              {item}
            </div>
          ))}
        </div>
      </section>

      {/* POSITIONING */}
      <section
        id="positioning"
        data-section
        className={`py-20 bg-white ${sectionClass("positioning")}`}
      >
        <div className="max-w-5xl mx-auto px-6">
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-8 md:p-10 hover:shadow-sm transition-all duration-300 hover:-translate-y-[2px]">
            <p className="text-2xl md:text-3xl font-semibold leading-relaxed text-slate-900 mb-6">
              Built as a working MVP to demonstrate how blockchain can support more transparent
              property ownership, approval, and transfer workflows.
            </p>
            <div className="text-sm text-slate-500">
              BlockEstate • Blockchain Real Estate Marketplace Prototype
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section
        id="features"
        data-section
        className={`py-20 bg-[#F7FAFC] border-t border-slate-200 ${sectionClass("features")}`}
      >
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-3xl mb-12">
            <div className="text-sm font-semibold uppercase tracking-[0.18em] text-sky-700 mb-4 section-label">
              Features
            </div>
            <h2 className="text-4xl font-bold text-slate-900 mb-5 section-title-slide">
              Built around trust, approvals, and transaction clarity
            </h2>
            <p className="text-slate-600 leading-relaxed section-copy-slide">
              Instead of treating blockchain as a visual gimmick, BlockEstate uses it to
              support ownership traceability, escrow automation, and structured transaction logic.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {featureCards.map((feature, idx) => (
              <div
                key={idx}
                className={`rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 feature-enter`}
                style={{ animationDelay: `${idx * 0.08}s` }}
              >
                <div className="text-sm font-semibold text-sky-700 mb-3">
                  {String(idx + 1).padStart(2, "0")}
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-3">{feature.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WORKFLOW */}
      <section
        id="workflow"
        data-section
        className={`py-20 bg-white border-t border-slate-200 ${sectionClass("workflow")}`}
      >
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-3xl mb-12">
            <div className="text-sm font-semibold uppercase tracking-[0.18em] text-sky-700 mb-4 section-label">
              Workflow
            </div>
            <h2 className="text-4xl font-bold text-slate-900 mb-5 section-title-slide">
              From property listing to ownership transfer
            </h2>
            <p className="text-slate-600 leading-relaxed section-copy-slide">
              The platform follows a practical, approval-based flow that reflects how a real estate
              transaction might progress in a controlled digital environment.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {workflowSteps.map((item, idx) => (
              <div
                key={idx}
                className={`rounded-2xl border border-slate-200 bg-slate-50 p-6 hover:shadow-sm hover:-translate-y-1 transition-all duration-300 ${
                  idx % 2 === 0 ? "slide-in-left" : "slide-in-right"
                }`}
                style={{ animationDelay: `${idx * 0.08}s` }}
              >
                <div className="text-sm font-semibold text-sky-700 mb-3">{item.step}</div>
                <h3 className="text-lg font-semibold text-slate-900 mb-3">{item.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BUILT */}
      <section
        id="built"
        data-section
        className={`py-20 bg-[#F7FAFC] border-t border-slate-200 ${sectionClass("built")}`}
      >
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-start">
          <div className="slide-in-left">
            <div className="text-sm font-semibold uppercase tracking-[0.18em] text-sky-700 mb-4">
              What’s built
            </div>
            <h2 className="text-4xl font-bold text-slate-900 mb-5">
              A working MVP, not just a concept
            </h2>
            <p className="text-slate-600 leading-relaxed">
              The current prototype already demonstrates the essential components of a blockchain-based
              real estate marketplace, including tokenized ownership, escrow, approvals, and listing flows.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {builtItems.map((item, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-slate-200 bg-white p-4 flex items-start gap-3 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 built-card"
                style={{ animationDelay: `${idx * 0.06}s` }}
              >
                <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs mt-0.5">
                  ✓
                </span>
                <span className="text-sm text-slate-700">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TECH */}
      <section
        id="technology"
        data-section
        className={`py-20 bg-white border-t border-slate-200 ${sectionClass("technology")}`}
      >
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-3xl mb-12">
            <div className="text-sm font-semibold uppercase tracking-[0.18em] text-sky-700 mb-4">
              Technology stack
            </div>
            <h2 className="text-4xl font-bold text-slate-900 mb-5">
              Built with proven smart contract and frontend tools
            </h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
            {["Solidity", "Hardhat", "OpenZeppelin", "Ethers.js", "Next.js", "React", "MetaMask", "IPFS"].map(
              (tech, idx) => (
                <div
                  key={tech}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-5 text-center text-sm font-medium text-slate-700 hover:shadow-sm hover:-translate-y-0.5 transition-all duration-300 tech-pill"
                  style={{ animationDelay: `${idx * 0.05}s` }}
                >
                  {tech}
                </div>
              )
            )}
          </div>
        </div>
      </section>

      {/* ROADMAP */}
      <section
        id="roadmap"
        data-section
        className={`py-20 bg-[#F7FAFC] border-t border-slate-200 ${sectionClass("roadmap")}`}
      >
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-3xl mb-12">
            <div className="text-sm font-semibold uppercase tracking-[0.18em] text-sky-700 mb-4">
              Roadmap
            </div>
            <h2 className="text-4xl font-bold text-slate-900 mb-5">
              Planned improvements to the platform
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {roadmapItems.map((item, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 roadmap-card"
                style={{ animationDelay: `${idx * 0.08}s` }}
              >
                <div className="text-sm font-semibold text-sky-700 mb-3">
                  {String(idx + 1).padStart(2, "0")}
                </div>
                <p className="text-sm text-slate-600 leading-relaxed">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-24 bg-white border-t border-slate-200">
        <div className="max-w-4xl mx-auto px-6 text-center cta-enter">
          <div className="text-sm font-semibold uppercase tracking-[0.18em] text-sky-700 mb-4">
            Explore the prototype
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
            Review the marketplace, contracts, and transaction flow
          </h2>
          <p className="text-slate-600 text-lg leading-relaxed mb-10">
            View the live demo, connect a wallet, and inspect how the approval-based
            blockchain workflow operates across listing, escrow, and transfer.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => router.push("/")}
              className="px-8 py-4 rounded-xl bg-sky-600 text-white font-semibold hover:bg-sky-700 hover:shadow-md transition-all duration-300 shadow-sm hover:-translate-y-[1px]"
            >
              Launch Demo
            </button>
            <button
              onClick={() => window.open("https://github.com", "_blank")}
              className="px-8 py-4 rounded-xl border border-slate-300 bg-white text-slate-800 font-semibold hover:bg-slate-50 hover:shadow-sm transition-all duration-300 hover:-translate-y-[1px]"
            >
              View on GitHub
            </button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-slate-200 bg-slate-50 py-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 fade-in-up">
            <div className="w-9 h-9 rounded-xl bg-sky-600 flex items-center justify-center shadow-sm transition-transform duration-300 hover:scale-[1.03]">
              <svg
                className="w-4 h-4 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0h6"
                />
              </svg>
            </div>
            <div>
              <div className="font-semibold text-slate-900">BlockEstate</div>
              <div className="text-xs text-slate-500">Blockchain Real Estate Marketplace MVP</div>
            </div>
          </div>

          <div className="text-sm text-slate-500 fade-in-up delay-1">
            © 2026 BlockEstate. Built with Solidity, Hardhat, Next.js and IPFS.
          </div>
        </div>
      </footer>

      <style jsx global>{`
        html {
          scroll-behavior: smooth;
        }

        @keyframes fadeUpSoft {
          from {
            opacity: 0;
            transform: translateY(18px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeDownSoft {
          from {
            opacity: 0;
            transform: translateY(-14px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideLeftSoft {
          from {
            opacity: 0;
            transform: translateX(-28px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes slideRightSoft {
          from {
            opacity: 0;
            transform: translateX(28px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes heroReveal {
          from {
            opacity: 0;
            transform: translateY(22px);
            filter: blur(6px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
            filter: blur(0);
          }
        }

        @keyframes panelEnter {
          from {
            opacity: 0;
            transform: translateX(32px) translateY(14px);
          }
          to {
            opacity: 1;
            transform: translateX(0) translateY(0);
          }
        }

        @keyframes glowBreath {
          0%, 100% {
            opacity: 0.35;
            transform: scale(1);
          }
          50% {
            opacity: 0.55;
            transform: scale(1.04);
          }
        }

        @keyframes pulseSoft {
          0%, 100% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.2);
            opacity: 0.85;
          }
        }

        .hero-reveal {
          opacity: 0;
          animation: heroReveal 0.8s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }

        .delay-1 { animation-delay: 0.08s; }
        .delay-2 { animation-delay: 0.16s; }
        .delay-3 { animation-delay: 0.24s; }
        .delay-4 { animation-delay: 0.32s; }
        .delay-5 { animation-delay: 0.4s; }
        .delay-6 { animation-delay: 0.48s; }

        .fade-in-up {
          opacity: 0;
          animation: fadeUpSoft 0.7s ease forwards;
        }

        .fade-in-down {
          opacity: 0;
          animation: fadeDownSoft 0.7s ease forwards;
        }

        .slide-in-left {
          opacity: 0;
          animation: slideLeftSoft 0.75s ease forwards;
        }

        .slide-in-right {
          opacity: 0;
          animation: slideRightSoft 0.75s ease forwards;
        }

        .slide-fade-in {
          opacity: 0;
          animation: fadeUpSoft 0.7s ease forwards;
        }

        .hero-panel-enter {
          opacity: 0;
          animation: panelEnter 0.9s cubic-bezier(0.22, 1, 0.36, 1) forwards;
          animation-delay: 0.24s;
        }

        .image-slide-up,
        .progress-slide-up,
        .section-label,
        .section-title-slide,
        .section-copy-slide,
        .cta-enter {
          opacity: 0;
          animation: fadeUpSoft 0.8s ease forwards;
        }

        .image-slide-up { animation-delay: 0.15s; }
        .progress-slide-up { animation-delay: 0.45s; }
        .section-label { animation-delay: 0.05s; }
        .section-title-slide { animation-delay: 0.12s; }
        .section-copy-slide { animation-delay: 0.2s; }
        .cta-enter { animation-delay: 0.05s; }

        .slide-up-card,
        .progress-row,
        .feature-enter,
        .built-card,
        .tech-pill,
        .roadmap-card {
          opacity: 0;
          animation: fadeUpSoft 0.7s ease forwards;
        }

        .hero-glow {
          animation: glowBreath 6s ease-in-out infinite;
        }

        .pulse-dot {
          animation: pulseSoft 2s ease-in-out infinite;
        }

        .hero-card {
          transition: transform 0.35s ease, box-shadow 0.35s ease;
        }

        .hero-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 22px 36px rgba(15, 23, 42, 0.12);
        }

        .stat-card {
          transition: transform 0.28s ease, box-shadow 0.28s ease;
        }

        .stat-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 10px 24px rgba(15, 23, 42, 0.08);
        }

        .nav-link {
          position: relative;
        }

        .nav-link::after {
          content: "";
          position: absolute;
          left: 0;
          bottom: -6px;
          width: 100%;
          height: 1.5px;
          background: #0284c7;
          transform: scaleX(0);
          transform-origin: left;
          transition: transform 0.28s ease;
        }

        .nav-link:hover::after {
          transform: scaleX(1);
        }

        .reveal-section {
          opacity: 0;
          transform: translateY(28px);
          transition: opacity 0.85s ease, transform 0.85s ease;
        }

        .reveal-section.is-visible {
          opacity: 1;
          transform: translateY(0);
        }

        @media (prefers-reduced-motion: reduce) {
          html {
            scroll-behavior: auto;
          }

          *,
          *::before,
          *::after {
            animation: none !important;
            transition: none !important;
          }

          .reveal-section,
          .hero-reveal,
          .fade-in-up,
          .fade-in-down,
          .slide-in-left,
          .slide-in-right,
          .slide-fade-in,
          .hero-panel-enter,
          .image-slide-up,
          .progress-slide-up,
          .section-label,
          .section-title-slide,
          .section-copy-slide,
          .cta-enter,
          .slide-up-card,
          .progress-row,
          .feature-enter,
          .built-card,
          .tech-pill,
          .roadmap-card {
            opacity: 1 !important;
            transform: none !important;
            filter: none !important;
          }
        }
      `}</style>
    </div>
  );
}