import { ethers } from "ethers";
import dotenv from 'dotenv';
import pgPromise from 'pg-promise';

dotenv.config();

const ALCHEMY_PROJECT_ID = process.env.ALCHEMY_PROJECT_ID;
if (!ALCHEMY_PROJECT_ID) {
    throw new Error("ALCHEMY_PROJECT_ID is not set in the environment");
}

const provider = new ethers.AlchemyProvider("optimism-sepolia", ALCHEMY_PROJECT_ID);

// Database setup
const pgp = pgPromise();
const db = pgp(process.env.DATABASE_URL!);

const contractAddress = "0x117DA503d0C065A99C9cc640d963Bbd7081A0beb";
const abi = [
    "event KeyServiceActionRequest(address indexed sender, (address sender, uint256 nonce, bytes initCode, bytes callData, uint256 callGasLimit, uint256 verificationGasLimit, uint256 preVerificationGas, uint256 maxFeePerGas, uint256 maxPriorityFeePerGas, bytes paymasterAndData, bytes signature) userOp)"
];

const contract = new ethers.Contract(contractAddress, abi, provider);

async function processEvent(event: ethers.EventLog | ethers.Log) {
    let sender: string;
    let userOp: any;

    if ('args' in event) {
        [sender, userOp] = event.args;
    } else {
        const iface = new ethers.Interface(abi);
        const decoded = iface.parseLog(event);
        if (decoded) {
            [sender, userOp] = decoded.args;
        } else {
            console.error('Failed to decode event');
            return;
        }
    }

    console.log(`KeyServiceActionRequest detected: ${sender}`);

    // Convert BigInt values to strings
    const serializedUserOp = JSON.stringify(userOp, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value
    );

    try {
        await db.none(`
            INSERT INTO key_service_events(sender, user_op, transaction_hash, block_number)
            VALUES($1, $2, $3, $4)
            ON CONFLICT (transaction_hash, block_number) DO NOTHING
        `, [sender, serializedUserOp, event.transactionHash, event.blockNumber]);
        console.log("Event processed");
    } catch (error) {
        console.error("Error processing event:", error);
    }
}

async function indexPastEvents(fromBlock: number) {
    console.log(`Indexing past events from block ${fromBlock}`);
    const events = await contract.queryFilter("KeyServiceActionRequest", fromBlock);
    for (const event of events) {
        await processEvent(event);
    }
    console.log("Finished indexing past events");
}

async function startListening(fromBlock: number) {
    await indexPastEvents(fromBlock);

    contract.on("KeyServiceActionRequest", (sender, userOp, event) => processEvent(event));
    console.log("Listening for new KeyServiceActionRequest events...");
}

// Usage
const startBlockNumber = 123456; // Replace with your desired starting block number
startListening(startBlockNumber);