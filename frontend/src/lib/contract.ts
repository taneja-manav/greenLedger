import { ethers } from 'ethers';

export const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS!;

export const ABI = [
  // Read
  "function balanceOf(address account, uint256 id) view returns (uint256)",
  "function balanceOfBatch(address[] accounts, uint256[] ids) view returns (uint256[])",
  "function listings(uint256 listingId) view returns (address seller, uint256 tokenId, uint256 amount, uint256 priceInInr, bool active)",
  "function nextListingId() view returns (uint256)",
  // Write
  "function listCredits(uint256 id, uint256 amount, uint256 price) external",
  "function setApprovalForAll(address operator, bool approved) external",
  "function isApprovedForAll(address account, address operator) view returns (bool)",
  // Events
  "event Listed(uint256 listingId, address indexed seller, uint256 tokenId, uint256 amount)",
  "event Swapped(uint256 listingId, address indexed buyer, uint256 amount)",
  "event CreditMinted(address indexed to, uint256 id, uint256 amount)",
];

export function getReadContract(providerUrl?: string) {
  const rpc = providerUrl || process.env.NEXT_PUBLIC_RPC_URL || 'https://rpc.sepolia.org';
  const provider = new ethers.JsonRpcProvider(rpc);
  return new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);
}

export async function getSignedContract() {
  if (typeof window === 'undefined' || !window.ethereum) throw new Error('MetaMask not found');
  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  return new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
}
