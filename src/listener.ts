import { ethers } from "ethers";

const ALCHEMY_PROJECT_ID = "IyxypzOlPcX8OkXMfh4k_uUsOTXF9hcz";
const provider = new ethers.AlchemyProvider("optimism-sepolia", ALCHEMY_PROJECT_ID);

const contractAddress = "0xYourContractAddress";
const abi = [
    "event KeyServiceActionRequest(address indexed sender, UserOperation userOp)"
];

const contract = new ethers.Contract(contractAddress, abi, provider);

contract.on("KeyServiceActionRequest", (sender, userOp, event) => {
    console.log(`KeyServiceActionRequest detected: ${sender}, ${userOp}`);
    // Event object contains additional information like block number, transaction hash, etc.
    console.log(event);
});

console.log("Listening for Transfer events...");