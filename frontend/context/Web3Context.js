import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { ethers } from "ethers";
import RealEstateABI from "../abis/RealEstate.json";
import EscrowABI from "../abis/Escrow.json";
import { REAL_ESTATE_ADDRESS, ESCROW_ADDRESS, ROLES } from "../utils/constants";
import { isZeroAddress, parseTokenMetadata } from "../utils/helpers";
import { useAuth } from "./AuthContext";

const Web3Context = createContext();

export const useWeb3 = () => {
  const context = useContext(Web3Context);
  if (!context) {
    throw new Error("useWeb3 must be used within a Web3Provider");
  }
  return context;
};

const realEstateAbi = RealEstateABI.abi || RealEstateABI;
const escrowAbi = EscrowABI.abi || EscrowABI;

export const Web3Provider = ({ children }) => {
  const { user } = useAuth();

  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [realEstate, setRealEstate] = useState(null);
  const [escrow, setEscrow] = useState(null);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [kycStatus, setKycStatus] = useState({});

  const didInitRef = useRef(false);
  const refreshingRef = useRef(false);

  const userRole = user?.role || "guest";
  const linkedWallet = user?.walletAddress || "";
  const requiredRoleWallet =
    ["inspector", "government", "lender"].includes(userRole) ? ROLES[userRole] : null;

  const isLinkedWalletMatch = useMemo(() => {
    if (!linkedWallet || !account) return false;
    return linkedWallet.toLowerCase() === account.toLowerCase();
  }, [linkedWallet, account]);

  const canUseConnectedWallet = useMemo(() => {
    if (!account) return false;
    if (!linkedWallet) return true;
    return isLinkedWalletMatch;
  }, [account, linkedWallet, isLinkedWalletMatch]);

  const isSpecialRoleWalletMatch = useMemo(() => {
    if (!requiredRoleWallet) return true;
    if (!account) return false;
    return requiredRoleWallet.toLowerCase() === account.toLowerCase();
  }, [requiredRoleWallet, account]);

  const canUseRoleWallet = useMemo(() => {
    if (!canUseConnectedWallet) return false;
    return isSpecialRoleWalletMatch;
  }, [canUseConnectedWallet, isSpecialRoleWalletMatch]);

  const buildRuntime = useCallback(async (requestAccounts = false) => {
    if (typeof window === "undefined" || !window.ethereum) {
      return null;
    }

    const web3Provider = new ethers.providers.Web3Provider(window.ethereum);

    let accounts = [];
    if (requestAccounts) {
      accounts = await web3Provider.send("eth_requestAccounts", []);
    } else {
      accounts = await web3Provider.send("eth_accounts", []);
    }

    const nextAccount =
      accounts.length > 0 ? ethers.utils.getAddress(accounts[0]) : null;

    const nextSigner = nextAccount ? web3Provider.getSigner() : null;

    const realEstateContract = new ethers.Contract(
      REAL_ESTATE_ADDRESS,
      realEstateAbi,
      web3Provider
    );

    const escrowContract = new ethers.Contract(
      ESCROW_ADDRESS,
      escrowAbi,
      web3Provider
    );

    return {
      web3Provider,
      nextAccount,
      nextSigner,
      realEstateContract,
      escrowContract,
    };
  }, []);

  const loadBlockchainData = useCallback(
    async (requestAccounts = false) => {
      if (refreshingRef.current) return;

      try {
        refreshingRef.current = true;
        setLoading(true);

        const runtime = await buildRuntime(requestAccounts);

        if (!runtime) {
          setLoading(false);
          return;
        }

        const {
          web3Provider,
          nextAccount,
          nextSigner,
          realEstateContract,
          escrowContract,
        } = runtime;

        setProvider(web3Provider);
        setSigner(nextSigner);
        setAccount(nextAccount);
        setRealEstate(realEstateContract);
        setEscrow(escrowContract);

        const transferTopic = ethers.utils.id("Transfer(address,address,uint256)");
        const zeroAddressPadded = ethers.utils.hexZeroPad(
          ethers.constants.AddressZero,
          32
        );

        let tokenIds = [];

        try {
          const logs = await web3Provider.send("eth_getLogs", [
            {
              address: REAL_ESTATE_ADDRESS,
              topics: [transferTopic, zeroAddressPadded],
              fromBlock: "0x0",
              toBlock: "latest",
            },
          ]);

          tokenIds = [
            ...new Set(
              logs
                .map((log) => {
                  if (log.topics && log.topics.length >= 4) {
                    return parseInt(log.topics[3], 16);
                  }
                  return null;
                })
                .filter((id) => id !== null && id > 0)
            ),
          ].sort((a, b) => a - b);
        } catch (error) {
          console.log("eth_getLogs failed, falling back:", error.message);

          for (let i = 1; i <= 100; i++) {
            try {
              await realEstateContract.ownerOf(i);
              tokenIds.push(i);
            } catch {
              break;
            }
          }
        }

        const loadedProperties = [];

        for (const tokenId of tokenIds) {
          try {
            const listing = await escrowContract.listings(tokenId);
            const owner = await realEstateContract.ownerOf(tokenId);
            const uri = await realEstateContract.tokenURI(tokenId);
            const metadata = await parseTokenMetadata(uri);

            const buyerDeposited = !isZeroAddress(listing.buyer);
            const sold = !listing.isListed && buyerDeposited;

            if (listing.isListed || sold) {
              loadedProperties.push({
                id: tokenId,
                uri,
                image: metadata.image || uri,
                name: metadata.name || `Property #${tokenId}`,
                description: metadata.description || "",
                location: metadata.location || "",
                propertyType: metadata.propertyType || "",
                area: metadata.area || "",
                documents: metadata.documents || "",
                attributes: metadata.attributes || {},
                price: ethers.utils.formatEther(listing.purchasePrice || 0),
                purchasePrice: listing.purchasePrice,
                escrowAmount: listing.escrowAmount,
                seller: listing.seller,
                buyer: listing.buyer,
                currentOwner: owner,
                inspectionPassed: listing.inspectionPassed,
                lenderApproved: listing.lenderApproved,
                governmentVerified: listing.governmentVerified,
                sellerApproved: listing.sellerApproved,
                buyerDeposited,
                sold,
              });
            }
          } catch (error) {
            console.log(`Skipping token ${tokenId}:`, error.message);
          }
        }

        setProperties(loadedProperties);
      } catch (error) {
        console.error("Load blockchain data error:", error);
      } finally {
        refreshingRef.current = false;
        setLoading(false);
      }
    },
    [buildRuntime]
  );

  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        alert("Please install MetaMask.");
        return;
      }

      await loadBlockchainData(true);
    } catch (error) {
      console.error("Wallet connect failed:", error);
    }
  };

  const loadTransactionHistory = useCallback(
    async (tokenId) => {
      try {
        if (!tokenId) return [];

        let web3Provider = provider;
        let escrowContract = escrow;

        if (!web3Provider || !escrowContract) {
          const runtime = await buildRuntime(false);
          if (!runtime) return [];
          web3Provider = runtime.web3Provider;
          escrowContract = runtime.escrowContract;
        }

        if (!escrowContract.filters?.PropertyListed) return [];

        const eventGroups = await Promise.all([
          escrowContract.queryFilter(
            escrowContract.filters.PropertyListed(tokenId),
            0,
            "latest"
          ),
          escrowContract.queryFilter(
            escrowContract.filters.EarnestDeposited(tokenId),
            0,
            "latest"
          ),
          escrowContract.queryFilter(
            escrowContract.filters.InspectionStatusUpdated(tokenId),
            0,
            "latest"
          ),
          escrowContract.queryFilter(
            escrowContract.filters.SaleApprovalUpdated(tokenId),
            0,
            "latest"
          ),
          escrowContract.queryFilter(
            escrowContract.filters.PropertyVerified(tokenId),
            0,
            "latest"
          ),
          escrowContract.queryFilter(
            escrowContract.filters.SaleFinalized(tokenId),
            0,
            "latest"
          ),
        ]);

        const events = eventGroups.flat();

        const parsed = await Promise.all(
          events.map(async (event) => {
            const block = await web3Provider.getBlock(event.blockNumber);
            const timestamp = block?.timestamp ? block.timestamp * 1000 : Date.now();

            const common = {
              id: `${event.transactionHash}-${event.logIndex}`,
              txHash: event.transactionHash,
              blockNumber: event.blockNumber,
              timestamp,
              tokenId,
            };

            switch (event.event) {
              case "PropertyListed":
                return {
                  ...common,
                  type: "listed",
                  title: "Property listed",
                  actor: event.args.seller,
                  amount: ethers.utils.formatEther(event.args.purchasePrice),
                  subtitle: `Listed for ${ethers.utils.formatEther(
                    event.args.purchasePrice
                  )} ETH with ${ethers.utils.formatEther(
                    event.args.escrowAmount
                  )} ETH escrow.`,
                };

              case "EarnestDeposited":
                return {
                  ...common,
                  type: "deposit",
                  title: "Buyer funded escrow",
                  actor: event.args.buyer,
                  amount: ethers.utils.formatEther(event.args.amount),
                  subtitle: `Buyer deposited ${ethers.utils.formatEther(
                    event.args.amount
                  )} ETH.`,
                };

              case "InspectionStatusUpdated":
                return {
                  ...common,
                  type: "inspection",
                  title: event.args.passed ? "Inspection approved" : "Inspection failed",
                  actor: event.args.inspector,
                  subtitle: event.args.passed
                    ? "Inspector marked the property as passed."
                    : "Inspector marked the property as failed.",
                };

              case "SaleApprovalUpdated":
                return {
                  ...common,
                  type: "approval",
                  title: "Approval recorded",
                  actor: event.args.approver,
                  subtitle: `Approval state → lender: ${
                    event.args.lenderApproved ? "yes" : "no"
                  }, seller: ${event.args.sellerApproved ? "yes" : "no"}.`,
                };

              case "PropertyVerified":
                return {
                  ...common,
                  type: "verification",
                  title: "Government verification complete",
                  actor: event.args.government,
                  subtitle: "Government wallet verified the property.",
                };

              case "SaleFinalized":
                return {
                  ...common,
                  type: "sale",
                  title: "Sale finalized",
                  actor: event.args.seller,
                  amount: ethers.utils.formatEther(event.args.amount),
                  subtitle: `Ownership transferred to ${event.args.buyer}.`,
                };

              default:
                return null;
            }
          })
        );

        return parsed
          .filter(Boolean)
          .sort((a, b) => a.timestamp - b.timestamp || a.blockNumber - b.blockNumber);
      } catch (error) {
        console.error("Failed to load transaction history:", error);
        return [];
      }
    },
    [provider, escrow, buildRuntime]
  );

  const runAIInspection = useCallback(async (property) => {
    const response = await fetch("/api/ai-inspect", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ property }),
    });

    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload?.error || "AI inspection failed");
    }

    return {
      ...(payload?.result || {}),
      rawText: payload?.rawText || "",
      model: payload?.model || null,
      inspectedAt: new Date().toISOString(),
    };
  }, []);

  const requestKYC = (address) => {
    setKycStatus((prev) => ({
      ...prev,
      [String(address || "").toLowerCase()]: "pending",
    }));
  };

  const approveKYC = (address) => {
    setKycStatus((prev) => ({
      ...prev,
      [String(address || "").toLowerCase()]: "verified",
    }));
  };

  const rejectKYC = (address) => {
    setKycStatus((prev) => ({
      ...prev,
      [String(address || "").toLowerCase()]: "rejected",
    }));
  };

  const getKYCStatus = (address) => {
    if (!address) return "none";
    return kycStatus[String(address).toLowerCase()] || "none";
  };

  const isKYCVerified = (address) => {
    return getKYCStatus(address) === "verified";
  };

  useEffect(() => {
    if (didInitRef.current) return;
    didInitRef.current = true;
    loadBlockchainData(false);
  }, [loadBlockchainData]);

  useEffect(() => {
    if (typeof window === "undefined" || !window.ethereum) return;

    const handleAccountsChanged = async () => {
      await loadBlockchainData(false);
    };

    const handleChainChanged = async () => {
      await loadBlockchainData(false);
    };

    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged", handleChainChanged);

    return () => {
      if (window.ethereum.removeListener) {
        window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
        window.ethereum.removeListener("chainChanged", handleChainChanged);
      }
    };
  }, [loadBlockchainData]);

  const value = {
    account,
    provider,
    signer,
    realEstate,
    escrow,
    properties,
    loading,
    userRole,
    linkedWallet,
    requiredRoleWallet,
    isLinkedWalletMatch,
    isSpecialRoleWalletMatch,
    canUseConnectedWallet,
    canUseRoleWallet,
    connectWallet,
    loadBlockchainData,
    loadTransactionHistory,
    runAIInspection,
    requestKYC,
    approveKYC,
    rejectKYC,
    getKYCStatus,
    isKYCVerified,
    kycStatus,
  };

  return <Web3Context.Provider value={value}>{children}</Web3Context.Provider>;
};