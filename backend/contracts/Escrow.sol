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

    // Seller lists a property
    function list(
        uint256 _nftID,
        uint256 _purchasePrice,
        uint256 _escrowAmount
    ) public {
        require(_purchasePrice > 0, "Price must be greater than 0");
        require(_escrowAmount > 0, "Escrow amount must be greater than 0");

        listings[_nftID] = Listing(
            true,
            payable(msg.sender),      // seller
            payable(address(0)),      // buyer
            _purchasePrice,
            _escrowAmount,
            false,
            false,
            false,
            false
        );
    }

    // Buyer deposits earnest/full payment
    function depositEarnest(uint256 _nftID) public payable {
        Listing storage item = listings[_nftID];

        require(item.isListed, "Property not listed");
        require(item.buyer == address(0), "Buyer already assigned");
        require(msg.value >= item.escrowAmount, "Not enough earnest money");

        item.buyer = payable(msg.sender);
    }

    // Inspector approves inspection
    function updateInspectionStatus(uint256 _nftID, bool _passed) public {
        require(msg.sender == inspector, "Only inspector can update status");
        require(listings[_nftID].isListed, "Property not listed");

        listings[_nftID].inspectionPassed = _passed;
    }

    // Lender or Seller approves sale
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
    }

    // Government verifies ownership
    function verifyProperty(uint256 _nftID) public {
        require(msg.sender == government, "Only government can verify");
        require(listings[_nftID].isListed, "Property not listed");

        listings[_nftID].governmentVerified = true;
    }

    // Finalize sale
    function finalizeSale(uint256 _nftID) public {
        Listing storage item = listings[_nftID];

        require(item.isListed, "Property not listed");
        require(item.buyer != address(0), "Buyer has not deposited funds");
        require(item.inspectionPassed, "Inspection failed");
        require(item.lenderApproved, "Lender not approved");
        require(item.governmentVerified, "Government verification missing");
        require(item.sellerApproved, "Seller not approved");
        require(address(this).balance >= item.purchasePrice, "Insufficient funds");

        // transfer funds to seller
        (bool success, ) = item.seller.call{value: item.purchasePrice}("");
        require(success, "Transfer failed");

        // transfer NFT to buyer
        IERC721(nftAddress).transferFrom(item.seller, item.buyer, _nftID);

        // mark listing as sold
        item.isListed = false;
    }

    receive() external payable {}
}