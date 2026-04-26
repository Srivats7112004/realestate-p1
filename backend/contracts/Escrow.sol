// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IERC721 {
    function transferFrom(address from, address to, uint256 tokenId) external;
    function ownerOf(uint256 tokenId) external view returns (address);
    function getApproved(uint256 tokenId) external view returns (address);
    function isApprovedForAll(address owner, address operator) external view returns (bool);
}

contract Escrow {
    address public owner;
    address public nftAddress;

    mapping(address => bool) public inspectors;
    mapping(address => bool) public lenders;
    mapping(address => bool) public governments;

    struct Listing {
        bool isListed;
        address payable seller;
        address payable buyer;
        uint256 purchasePrice;
        uint256 escrowAmount;
        bool inspectionPassed;
        bool lenderApproved;
        bool governmentVerified;
        bool sellerApproved;
    }

    mapping(uint256 => Listing) public listings;

    event PropertyListed(
        uint256 indexed nftID,
        address indexed seller,
        uint256 purchasePrice,
        uint256 escrowAmount,
        uint256 timestamp
    );

    event EarnestDeposited(
        uint256 indexed nftID,
        address indexed buyer,
        uint256 amount,
        uint256 timestamp
    );

    event InspectionStatusUpdated(
        uint256 indexed nftID,
        address indexed inspector,
        bool passed,
        uint256 timestamp
    );

    event SaleApprovalUpdated(
        uint256 indexed nftID,
        address indexed approver,
        bool lenderApproved,
        bool sellerApproved,
        uint256 timestamp
    );

    event PropertyVerified(
        uint256 indexed nftID,
        address indexed government,
        uint256 timestamp
    );

    event SaleFinalized(
        uint256 indexed nftID,
        address indexed seller,
        address indexed buyer,
        uint256 amount,
        uint256 timestamp
    );

    event OwnershipTransferred(
        address indexed oldOwner,
        address indexed newOwner
    );

    event InspectorRoleGranted(address indexed user);
    event InspectorRoleRevoked(address indexed user);

    event LenderRoleGranted(address indexed user);
    event LenderRoleRevoked(address indexed user);

    event GovernmentRoleGranted(address indexed user);
    event GovernmentRoleRevoked(address indexed user);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    modifier onlyInspector() {
        require(inspectors[msg.sender], "Only inspector");
        _;
    }

    modifier onlyLender() {
        require(lenders[msg.sender], "Only lender");
        _;
    }

    modifier onlyGovernment() {
        require(governments[msg.sender], "Only government");
        _;
    }

    constructor(
        address _nftAddress,
        address _inspector,
        address _lender,
        address _government
    ) {
        require(_nftAddress != address(0), "Invalid NFT address");

        owner = msg.sender;
        nftAddress = _nftAddress;

        // Give deployer all roles by default.
        // This is very useful for demo/testing so one wallet can do everything.
        inspectors[msg.sender] = true;
        lenders[msg.sender] = true;
        governments[msg.sender] = true;

        emit InspectorRoleGranted(msg.sender);
        emit LenderRoleGranted(msg.sender);
        emit GovernmentRoleGranted(msg.sender);

        // Also grant passed role wallets if provided.
        if (_inspector != address(0) && !inspectors[_inspector]) {
            inspectors[_inspector] = true;
            emit InspectorRoleGranted(_inspector);
        }

        if (_lender != address(0) && !lenders[_lender]) {
            lenders[_lender] = true;
            emit LenderRoleGranted(_lender);
        }

        if (_government != address(0) && !governments[_government]) {
            governments[_government] = true;
            emit GovernmentRoleGranted(_government);
        }
    }

    // -----------------------------
    // Admin / Role Management
    // -----------------------------

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Invalid new owner");
        address oldOwner = owner;
        owner = newOwner;
        emit OwnershipTransferred(oldOwner, newOwner);
    }

    function grantInspector(address user) external onlyOwner {
        require(user != address(0), "Invalid address");
        inspectors[user] = true;
        emit InspectorRoleGranted(user);
    }

    function revokeInspector(address user) external onlyOwner {
        require(user != address(0), "Invalid address");
        inspectors[user] = false;
        emit InspectorRoleRevoked(user);
    }

    function grantLender(address user) external onlyOwner {
        require(user != address(0), "Invalid address");
        lenders[user] = true;
        emit LenderRoleGranted(user);
    }

    function revokeLender(address user) external onlyOwner {
        require(user != address(0), "Invalid address");
        lenders[user] = false;
        emit LenderRoleRevoked(user);
    }

    function grantGovernment(address user) external onlyOwner {
        require(user != address(0), "Invalid address");
        governments[user] = true;
        emit GovernmentRoleGranted(user);
    }

    function revokeGovernment(address user) external onlyOwner {
        require(user != address(0), "Invalid address");
        governments[user] = false;
        emit GovernmentRoleRevoked(user);
    }

    function grantAllRoles(address user) external onlyOwner {
        require(user != address(0), "Invalid address");

        if (!inspectors[user]) {
            inspectors[user] = true;
            emit InspectorRoleGranted(user);
        }

        if (!lenders[user]) {
            lenders[user] = true;
            emit LenderRoleGranted(user);
        }

        if (!governments[user]) {
            governments[user] = true;
            emit GovernmentRoleGranted(user);
        }
    }

    function revokeAllRoles(address user) external onlyOwner {
        require(user != address(0), "Invalid address");

        if (inspectors[user]) {
            inspectors[user] = false;
            emit InspectorRoleRevoked(user);
        }

        if (lenders[user]) {
            lenders[user] = false;
            emit LenderRoleRevoked(user);
        }

        if (governments[user]) {
            governments[user] = false;
            emit GovernmentRoleRevoked(user);
        }
    }

    function hasAllRoles(address user) external view returns (bool) {
        return inspectors[user] && lenders[user] && governments[user];
    }

    // -----------------------------
    // Marketplace flow
    // -----------------------------

    function list(
        uint256 _nftID,
        uint256 _purchasePrice,
        uint256 _escrowAmount
    ) external {
        require(_purchasePrice > 0, "Price must be greater than 0");
        require(_escrowAmount > 0, "Escrow amount must be greater than 0");
        require(!listings[_nftID].isListed, "Already listed");

        require(
            IERC721(nftAddress).ownerOf(_nftID) == msg.sender,
            "Only owner can list"
        );

        require(
            IERC721(nftAddress).getApproved(_nftID) == address(this) ||
                IERC721(nftAddress).isApprovedForAll(msg.sender, address(this)),
            "Escrow not approved"
        );

        listings[_nftID] = Listing({
            isListed: true,
            seller: payable(msg.sender),
            buyer: payable(address(0)),
            purchasePrice: _purchasePrice,
            escrowAmount: _escrowAmount,
            inspectionPassed: false,
            lenderApproved: false,
            governmentVerified: false,
            sellerApproved: false
        });

        emit PropertyListed(
            _nftID,
            msg.sender,
            _purchasePrice,
            _escrowAmount,
            block.timestamp
        );
    }

    function depositEarnest(uint256 _nftID) external payable {
        Listing storage item = listings[_nftID];

        require(item.isListed, "Property not listed");
        require(item.seller != address(0), "Listing does not exist");
        require(item.buyer == address(0), "Buyer already assigned");
        require(msg.sender != item.seller, "Seller cannot buy own property");
        require(msg.value >= item.escrowAmount, "Not enough earnest money");

        item.buyer = payable(msg.sender);

        emit EarnestDeposited(_nftID, msg.sender, msg.value, block.timestamp);
    }

    function updateInspectionStatus(uint256 _nftID, bool _passed)
        external
        onlyInspector
    {
        Listing storage item = listings[_nftID];

        require(item.isListed, "Property not listed");
        require(item.seller != address(0), "Listing does not exist");

        item.inspectionPassed = _passed;

        emit InspectionStatusUpdated(
            _nftID,
            msg.sender,
            _passed,
            block.timestamp
        );
    }

    function approveSale(uint256 _nftID) external {
        Listing storage item = listings[_nftID];

        require(item.isListed, "Property not listed");
        require(item.seller != address(0), "Listing does not exist");

        if (lenders[msg.sender]) {
            item.lenderApproved = true;
        } else if (msg.sender == item.seller) {
            item.sellerApproved = true;
        } else {
            revert("Not authorized to approve sale");
        }

        emit SaleApprovalUpdated(
            _nftID,
            msg.sender,
            item.lenderApproved,
            item.sellerApproved,
            block.timestamp
        );
    }

    function verifyProperty(uint256 _nftID) external onlyGovernment {
        Listing storage item = listings[_nftID];

        require(item.isListed, "Property not listed");
        require(item.seller != address(0), "Listing does not exist");

        item.governmentVerified = true;

        emit PropertyVerified(_nftID, msg.sender, block.timestamp);
    }

    function finalizeSale(uint256 _nftID) external {
        Listing storage item = listings[_nftID];

        require(item.isListed, "Property not listed");
        require(item.seller != address(0), "Listing does not exist");
        require(msg.sender == item.seller, "Only seller can finalize sale");
        require(item.buyer != address(0), "Buyer has not deposited funds");
        require(item.inspectionPassed, "Inspection failed");
        require(item.lenderApproved, "Lender not approved");
        require(item.governmentVerified, "Government verification missing");
        require(item.sellerApproved, "Seller not approved");
        require(address(this).balance >= item.purchasePrice, "Insufficient funds");

        (bool success, ) = item.seller.call{value: item.purchasePrice}("");
        require(success, "Transfer failed");

        IERC721(nftAddress).transferFrom(item.seller, item.buyer, _nftID);

        item.isListed = false;

        emit SaleFinalized(
            _nftID,
            item.seller,
            item.buyer,
            item.purchasePrice,
            block.timestamp
        );
    }

    // Optional emergency recovery for owner if accidental ETH gets stuck.
    // Comment this out if you do not want owner withdrawal ability.
    function ownerWithdraw(uint256 amount) external onlyOwner {
        require(amount <= address(this).balance, "Insufficient balance");
        (bool success, ) = payable(owner).call{value: amount}("");
        require(success, "Withdraw failed");
    }

    receive() external payable {}
}