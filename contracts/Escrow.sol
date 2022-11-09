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
            false
        );
    }

    function depositEarnest(uint256 _tokenId)
        public
        payable
        onlyBuyer(_tokenId)
    {
        require(
            msg.value >= listing[_tokenId].escrowAmount,
            "Not enough funds"
        );
    }

    function updateInspectionStatus(uint256 _tokenId, bool _status)
        public
        onlyInspector
    {
        listing[_tokenId].inspectionPassed = _status;
    }

    function approveSale(uint256 _tokenId) public {
        approvals[_tokenId][msg.sender] = true;
    }
}
