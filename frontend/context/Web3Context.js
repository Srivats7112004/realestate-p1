// frontend/context/Web3Context.js
import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import RealEstateABI from "../abis/RealEstate.json";
import EscrowABI from "../abis/Escrow.json";
import { REAL_ESTATE_ADDRESS, ESCROW_ADDRESS, ROLES } from "../utils/constants";
import { isZeroAddress, parseTokenMetadata } from "../utils/helpers";

const Web3Context = createContext();

export const useWeb3 = () => {
  const context = useContext(Web3Context);
  if (!context) {
    throw new Error("useWeb3 must be used within a Web3Provider");
  }
  return context;
};

export const Web3Provider = ({ children }) => {
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [realEstate, setRealEstate] = useState(null);
  const [escrow, setEscrow] = useState(null);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState("user");
  const [kycStatus, setKycStatus] = useState({}); // Mock KYC state

  // Determine user role
  const determineRole = useCallback((address) => {
    if (!address) return "user";
    const addr = address.toLowerCase();
    if (addr === ROLES.inspector.toLowerCase()) return "inspector";
    if (addr === ROLES.lender.toLowerCase()) return "lender";
    if (addr === ROLES.government.toLowerCase()) return "government";
    return "user"; // could be buyer or seller
  }, []);

  // Connect wallet
  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        alert("Please install MetaMask!");
        return;
      }

      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });

      if (accounts.length > 0) {
        const address = ethers.utils.getAddress(accounts[0]);
        setAccount(address);
        setUserRole(determineRole(address));

        const prov = new ethers.providers.Web3Provider(window.ethereum);
        setProvider(prov);
        setSigner(prov.getSigner());
      }
    } catch (error) {
      console.error("Wallet connect failed:", error);
    }
  };

  // Load blockchain data
  const loadBlockchainData = useCallback(async () => {
    try {
      if (!window.ethereum) return;

      setLoading(true);

      const prov = new ethers.providers.Web3Provider(window.ethereum);
      setProvider(prov);

      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });

      if (accounts.length > 0) {
        const address = ethers.utils.getAddress(accounts[0]);
        setAccount(address);
        setUserRole(determineRole(address));
        setSigner(prov.getSigner());
      }

      const realEstateContract = new ethers.Contract(
        REAL_ESTATE_ADDRESS,
        RealEstateABI.abi,
        prov
      );
      setRealEstate(realEstateContract);

      const escrowContract = new ethers.Contract(
        ESCROW_ADDRESS,
        EscrowABI.abi,
        prov
      );
      setEscrow(escrowContract);

      // Load all properties
      const totalSupply = await realEstateContract.totalSupply();
      const loadedProperties = [];

      for (let i = 1; i <= totalSupply.toNumber(); i++) {
        try {
          const listing = await escrowContract.listings(i);

          if (listing.isListed) {
            const uri = await realEstateContract.tokenURI(i);
            const owner = await realEstateContract.ownerOf(i);
            const metadata = await parseTokenMetadata(uri);
            const buyerDeposited = !isZeroAddress(listing.buyer);

            loadedProperties.push({
              id: i,
              uri,
              image: metadata.image || uri,
              name: metadata.name || `Property #${i}`,
              description: metadata.description || "",
              location: metadata.location || "",
              propertyType: metadata.propertyType || "",
              area: metadata.area || "",
              documents: metadata.documents || "",
              attributes: metadata.attributes || {},
              price: ethers.utils.formatEther(listing.purchasePrice),
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
              sold: !listing.isListed && buyerDeposited,
            });
          }
        } catch (err) {
          console.log(`Skipping token ${i}:`, err.message);
        }
      }

      setProperties(loadedProperties);
    } catch (error) {
      console.error("Load blockchain data error:", error);
    } finally {
      setLoading(false);
    }
  }, [determineRole]);

  // Mock KYC functions
  const requestKYC = (address) => {
    setKycStatus((prev) => ({
      ...prev,
      [address.toLowerCase()]: "pending",
    }));
  };

  const approveKYC = (address) => {
    setKycStatus((prev) => ({
      ...prev,
      [address.toLowerCase()]: "verified",
    }));
  };

  const rejectKYC = (address) => {
    setKycStatus((prev) => ({
      ...prev,
      [address.toLowerCase()]: "rejected",
    }));
  };

  const getKYCStatus = (address) => {
    if (!address) return "none";
    return kycStatus[address.toLowerCase()] || "none";
  };

  const isKYCVerified = (address) => {
    return getKYCStatus(address) === "verified";
  };

  // Listen for account changes
  useEffect(() => {
    if (window.ethereum) {
      loadBlockchainData();

      const handleAccountsChanged = (accounts) => {
        if (accounts.length > 0) {
          const address = ethers.utils.getAddress(accounts[0]);
          setAccount(address);
          setUserRole(determineRole(address));
          loadBlockchainData();
        } else {
          setAccount(null);
          setUserRole("user");
        }
      };

      window.ethereum.on("accountsChanged", handleAccountsChanged);

      return () => {
        if (window.ethereum.removeListener) {
          window.ethereum.removeListener(
            "accountsChanged",
            handleAccountsChanged
          );
        }
      };
    }
  }, [loadBlockchainData, determineRole]);

  const value = {
    account,
    provider,
    signer,
    realEstate,
    escrow,
    properties,
    loading,
    userRole,
    connectWallet,
    loadBlockchainData,
    // KYC
    requestKYC,
    approveKYC,
    rejectKYC,
    getKYCStatus,
    isKYCVerified,
    kycStatus,
  };

  return <Web3Context.Provider value={value}>{children}</Web3Context.Provider>;
};