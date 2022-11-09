//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

interface IERC721 {
    function transferFrom(
        address _from,
        address _to,
        uint256 _id
    ) external;
}

contract Escrow {
    address public lender;
    address public inspector;
    address payable public seller;
    address public nftAddress;

    struct ListingData {
        address seller;
        uint256 purchasePrice;
        uint256 escrowAmount;
        address buyer;
        bool inspectionPassed;
        bool sold;
    }

    mapping(uint256 => ListingData) public listing;
    mapping(uint256 => mapping(address => bool)) public approvals;

    constructor(
        address _nftAddress,
        address payable _seller,
        address _inspector,
        address _lender
    ) {
        nftAddress = _nftAddress;
        seller = _seller;
        inspector = _inspector;
        lender = _lender;
    }

    modifier isNotSold(uint256 _id) {
        require(!listing[_id].sold, "Listing is already sold");
        _;
    }

    modifier onlySeller() {
        require(msg.sender == seller, "Only seller can call this function.");
        _;
    }

    modifier onlyBuyer(uint256 _tokenId) {
        require(
            msg.sender == listing[_tokenId].buyer,
            "Only buyer can call this function."
        );
        _;
    }

    modifier onlyInspector() {
        require(
            msg.sender == inspector,
            "Only inspector can call this function."
        );
        _;
    }

    function list(
        uint256 _tokenId,
        uint256 _purchasePrice,
        uint256 _escrowAmount,
        address buyer
    ) public payable onlySeller {
        IERC721(nftAddress).transferFrom(msg.sender, address(this), _tokenId);
        listing[_tokenId] = ListingData(
            msg.sender,
            _purchasePrice,
            _escrowAmount,
            buyer,
            false,
            false
        );
    }

    function depositEarnest(uint256 _tokenId)
        public
        payable
        onlyBuyer(_tokenId)
        isNotSold(_tokenId)
    {
        require(
            msg.value >= listing[_tokenId].escrowAmount,
            "Not enough funds"
        );
    }

    function updateInspectionStatus(uint256 _tokenId, bool _status)
        public
        onlyInspector
        isNotSold(_tokenId)
    {
        listing[_tokenId].inspectionPassed = _status;
    }

    function approveSale(uint256 _tokenId) public isNotSold(_tokenId) {
        approvals[_tokenId][msg.sender] = true;
    }

    function finalizeSale(uint256 _tokenId) public isNotSold(_tokenId) {
        require(listing[_tokenId].inspectionPassed, "Inspection not passed");
        require(approvals[_tokenId][seller], "Seller not approved");
        require(approvals[_tokenId][lender], "Lender not approved");
        require(
            approvals[_tokenId][listing[_tokenId].buyer],
            "Buyer not approved"
        );

        IERC721(nftAddress).transferFrom(
            address(this),
            listing[_tokenId].buyer,
            _tokenId
        );

        seller.transfer(listing[_tokenId].purchasePrice);

        listing[_tokenId].sold = true;
    }
}
