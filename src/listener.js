"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ethers_1 = require("ethers");
var ALCHEMY_PROJECT_ID = "IyxypzOlPcX8OkXMfh4k_uUsOTXF9hcz";
var provider = new ethers_1.ethers.AlchemyProvider("optimism-sepolia", ALCHEMY_PROJECT_ID);
var contractAddress = "0x117DA503d0C065A99C9cc640d963Bbd7081A0beb";
var abi = [
    "event KeyServiceActionRequest(address indexed sender, UserOperation userOp)",
    "struct UserOperation {address sender;uint256 nonce;bytes initCode;bytes callData;uint256 callGasLimit;uint256 verificationGasLimit;uint256 preVerificationGas;uint256 maxFeePerGas;uint256 maxPriorityFeePerGas;bytes paymasterAndData;bytes signature;}"
];
var contract = new ethers_1.ethers.Contract(contractAddress, abi, provider);
contract.on("KeyServiceActionRequest", function (sender, userOp, event) {
    console.log("KeyServiceActionRequest detected: ".concat(sender, ", ").concat(userOp));
    // Event object contains additional information like block number, transaction hash, etc.
    console.log(event);
});
console.log("Listening for KeyServiceActionRequest events...");
