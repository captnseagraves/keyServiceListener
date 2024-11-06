"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.submitUserOperation = submitUserOperation;
const ethers_1 = require("ethers");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const ALCHEMY_PROJECT_ID = process.env.ALCHEMY_PROJECT_ID;
if (!ALCHEMY_PROJECT_ID) {
    throw new Error("ALCHEMY_PROJECT_ID is not set in the environment");
}
const provider = new ethers_1.ethers.AlchemyProvider("sepolia", ALCHEMY_PROJECT_ID);
const wallet = new ethers_1.ethers.Wallet(process.env.PRIVATE_KEY, provider); // Ensure PRIVATE_KEY is set in your .env
// Define the entry point contract address and ABI
const entryPointAddress = "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789";
const entryPointAbi = [
    "function handleOps((address sender, uint256 nonce, bytes initCode, bytes callData, uint256 callGasLimit, uint256 verificationGasLimit, uint256 preVerificationGas, uint256 maxFeePerGas, uint256 maxPriorityFeePerGas, bytes paymasterAndData, bytes signature)[] ops, address payable beneficiary)"
];
const entryPointContract = new ethers_1.ethers.Contract(entryPointAddress, entryPointAbi, wallet);
async function submitUserOperation(userOp) {
    try {
        // Construct the UserOperation array
        const userOps = [userOp];
        // Define the beneficiary address (could be the sender or another address)
        const beneficiary = wallet.address;
        // Submit the transaction
        const tx = await entryPointContract.handleOps(userOps, beneficiary, {
            gasLimit: '1000000',
            gasPrice: (await provider.getFeeData()).gasPrice // Use getFeeData to get gas price
        });
        console.log(`Transaction submitted: ${tx.hash}`);
        await tx.wait();
        console.log("Transaction confirmed");
    }
    catch (error) {
        console.error("Error submitting transaction:", error);
    }
}
