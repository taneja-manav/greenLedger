// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract GreenLedger is ERC1155, AccessControl, ReentrancyGuard {
    bytes32 public constant REGULATOR_ROLE = keccak256("REGULATOR_ROLE");
    
    struct Listing {
        address seller;
        uint256 tokenId;
        uint256 amount;
        uint256 priceInInr; // Reference price for Razorpay/CBDC bridge
        bool active;
    }

    mapping(uint256 => Listing) public listings;
    uint256 public nextListingId;

    event CreditMinted(address indexed to, uint256 id, uint256 amount);
    event Listed(uint256 listingId, address indexed seller, uint256 tokenId, uint256 amount);
    event Swapped(uint256 listingId, address indexed buyer, uint256 amount);

    constructor() ERC1155("https://api.greenledger.in/metadata/{id}.json") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(REGULATOR_ROLE, msg.sender); // For MVP, Admin starts as Regulator
    }

    // 1. REGULATOR ONLY: Mint new REC/CCC
    function mintCredits(address to, uint256 id, uint256 amount) external onlyRole(REGULATOR_ROLE) {
        _mint(to, id, amount, "");
        emit CreditMinted(to, id, amount);
    }

    // 2. SELLER: List credits for sale
    function listCredits(uint256 id, uint256 amount, uint256 price) external {
        require(balanceOf(msg.sender, id) >= amount, "Insufficient balance");
        
        listings[nextListingId] = Listing(msg.sender, id, amount, price, true);
        emit Listed(nextListingId, msg.sender, id, amount);
        nextListingId++;
    }

    // 3. BACKEND ONLY: Execute Swap (Triggered by Razorpay/CBDC Webhook)
    // This function moves the asset after payment is confirmed off-chain
    function executeAtomicSwap(uint256 listingId, address buyer) external onlyRole(DEFAULT_ADMIN_ROLE) nonReentrant {
        Listing storage listing = listings[listingId];
        require(listing.active, "Listing not active");
        require(balanceOf(listing.seller, listing.tokenId) >= listing.amount, "Seller no longer has assets");

        listing.active = false;
        _safeTransferFrom(listing.seller, buyer, listing.tokenId, listing.amount, "");
        
        emit Swapped(listingId, buyer, listing.amount);
    }

    // Required overrides for AccessControl
    function supportsInterface(bytes4 interfaceId) public view override(ERC1155, AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}