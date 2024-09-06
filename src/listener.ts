import { ethers } from "ethers";
import dotenv from 'dotenv';

dotenv.config();

const ALCHEMY_PROJECT_ID = process.env.ALCHEMY_PROJECT_ID;
if (!ALCHEMY_PROJECT_ID) {
    throw new Error("ALCHEMY_PROJECT_ID is not set in the environment");
} const provider = new ethers.AlchemyProvider("optimism-sepolia", ALCHEMY_PROJECT_ID);

const contractAddress = "0x117DA503d0C065A99C9cc640d963Bbd7081A0beb";
const abi = [
    "event KeyServiceActionRequest(address indexed sender, (address sender, uint256 nonce, bytes initCode, bytes callData, uint256 callGasLimit, uint256 verificationGasLimit, uint256 preVerificationGas, uint256 maxFeePerGas, uint256 maxPriorityFeePerGas, bytes paymasterAndData, bytes signature) userOp)"
];

const contract = new ethers.Contract(contractAddress, abi, provider);

contract.on("KeyServiceActionRequest", (sender, userOp, event) => {
    console.log(`KeyServiceActionRequest detected: ${sender}, ${userOp}`);
    // Event object contains additional information like block number, transaction hash, etc.
    console.log(event);
});

console.log("Listening for KeyServiceActionRequest events...");