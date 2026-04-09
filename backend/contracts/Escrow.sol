// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IERC721 {
    function transferFrom(address from, address to, uint256 tokenId) external;
}

contract Escrow {
    address public nftAddress;
    address public inspector;
    address public lender;
    address public government;

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

    constructor(
        address _nftAddress,
        address _inspector,
        address _lender,
        address _government
    ) {
        nftAddress = _nftAddress;
        inspector = _inspector;
        lender = _lender;
        government = _government;
    }

    function list(
        uint256 _nftID,
        uint256 _purchasePrice,
        uint256 _escrowAmount
    ) public {
        require(_purchasePrice > 0, "Price must be greater than 0");
        require(_escrowAmount > 0, "Escrow amount must be greater than 0");

        listings[_nftID] = Listing(
            true,
            payable(msg.sender),
            payable(address(0)),
            _purchasePrice,
            _escrowAmount,
            false,
            false,
            false,
            false
        );

        emit PropertyListed(
            _nftID,
            msg.sender,
            _purchasePrice,
            _escrowAmount,
            block.timestamp
        );
    }

    function depositEarnest(uint256 _nftID) public payable {
        Listing storage item = listings[_nftID];

        require(item.isListed, "Property not listed");
        require(item.buyer == address(0), "Buyer already assigned");
        require(msg.value >= item.escrowAmount, "Not enough earnest money");

        item.buyer = payable(msg.sender);

        emit EarnestDeposited(_nftID, msg.sender, msg.value, block.timestamp);
    }

    function updateInspectionStatus(uint256 _nftID, bool _passed) public {
        require(msg.sender == inspector, "Only inspector can update status");
        require(listings[_nftID].isListed, "Property not listed");

        listings[_nftID].inspectionPassed = _passed;

        emit InspectionStatusUpdated(_nftID, msg.sender, _passed, block.timestamp);
    }

    function approveSale(uint256 _nftID) public {
        Listing storage item = listings[_nftID];
        require(item.isListed, "Property not listed");

        if (msg.sender == lender) {
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

    function verifyProperty(uint256 _nftID) public {
        require(msg.sender == government, "Only government can verify");
        require(listings[_nftID].isListed, "Property not listed");

        listings[_nftID].governmentVerified = true;

        emit PropertyVerified(_nftID, msg.sender, block.timestamp);
    }

    function finalizeSale(uint256 _nftID) public {
        Listing storage item = listings[_nftID];

        require(item.isListed, "Property not listed");
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

    receive() external payable {}
}