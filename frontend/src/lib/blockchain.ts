import { ethers } from 'ethers';

const rpcUrl = process.env.RPC_URL;
const privateKey = process.env.PRIVATE_KEY;
const contractAddress = process.env.CONTRACT_ADDRESS;

if (!rpcUrl || !privateKey || !contractAddress) {
  console.warn("Missing Web3 environment variables. Please check your .env file.");
}

export async function executeAtomicSwap(listingId: string, buyerAddress: string): Promise<string> {
  if (!rpcUrl || !privateKey || !contractAddress) {
    console.log('Skipping real blockchain execution (missing config). Returning mock hash.');
    return `0xmock_tx_${Math.random().toString(36).substring(7)}`;
  }

  try {
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const wallet = new ethers.Wallet(privateKey, provider);
    
    // Minimal ABI for the required function
    const abi = [
      "function executeAtomicSwap(uint256 listingId, address buyerAddress) external"
    ];
    
    const contract = new ethers.Contract(contractAddress, abi, wallet);

    console.log(`Executing atomic swap for listing: ${listingId}, buyer: ${buyerAddress}`);
    const tx = await contract.executeAtomicSwap(BigInt(listingId), buyerAddress);
    console.log(`Transaction sent. Hash: ${tx.hash}`);
    
    const receipt = await tx.wait();
    return receipt.hash;
  } catch (error) {
    console.error("Atomic Swap Execution Failed:", error);
    throw error;
  }
}
