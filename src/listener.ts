import { ethers } from "ethers";
import dotenv from 'dotenv';
import pgPromise from 'pg-promise';
import { submitUserOperation } from "./submitTransaction";

dotenv.config();

const ALCHEMY_PROJECT_ID = process.env.ALCHEMY_PROJECT_ID;
if (!ALCHEMY_PROJECT_ID) {
    throw new Error("ALCHEMY_PROJECT_ID is not set in the environment");
}

const chain_id = "optimism-sepolia";
const provider = new ethers.AlchemyProvider(chain_id, ALCHEMY_PROJECT_ID);

// Database setup
const pgp = pgPromise();
const db = pgp(process.env.DATABASE_URL!);

const signetEmitterContractAddress = "0x4DE3Fbb6dF50A7e6dBEEF948dFFC1E38bECeB72C";
const abi = [
    "event SignetActionRequest(address indexed sender, (address sender, uint256 nonce, bytes initCode, bytes callData, uint256 callGasLimit, uint256 verificationGasLimit, uint256 preVerificationGas, uint256 maxFeePerGas, uint256 maxPriorityFeePerGas, bytes paymasterAndData, bytes signature) userOp)"
];

const signetEmitterContract = new ethers.Contract(signetEmitterContractAddress, abi, provider);

const ISignetSmartWalletABI = [
    "function deploymentFactoryAddress() view returns (address)",
    "function getDeploymentOwners() view returns (address[])",
    "function deploymentNonce() view returns (uint256)"
];

const ISignetSmartWalletFactoryABI = [
    "function getAddress(address[] owners, uint256 nonce) view returns (address)"
];

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

    console.log(`SignetActionRequest detected: ${sender}`);

    // Create a contract instance for the ISignetSmartWallet
    const walletContract = new ethers.Contract(sender, ISignetSmartWalletABI, provider);
    let factoryAddress: string;
    let owners: any;
    let nonce: number;
    let accountAddress: string;


    try {
        // Call the deploymentFactoryAddress function
        factoryAddress = await walletContract.deploymentFactoryAddress();
    } catch (error) {
        console.error(`Error fetching deployment factory address for ${sender}:`, error);
        throw error;
    }

    try {
        owners = await walletContract.getDeploymentOwners();
    } catch (error) {
        console.error(`Error fetching deployment owners for ${sender}:`, error);
        throw error;
    }

    try {
        nonce = await walletContract.deploymentNonce();
    } catch (error) {
        console.error(`Error fetching deployment nonce for ${sender}:`, error);
        throw error;
    }

    console.log("factoryAddress", factoryAddress);
    console.log("owners", owners);
    console.log("nonce", Number(nonce));


    const factoryContract = new ethers.Contract(factoryAddress, ISignetSmartWalletFactoryABI, provider);


    const getAddressFunction = factoryContract.getFunction('getAddress');

    try {
        const result = await getAddressFunction(['0xC1200B5147ba1a0348b8462D00d237016945Dfff'], Number(nonce));
        accountAddress = result;
        console.log('Account address:', accountAddress);
    } catch (error) {
        accountAddress = "null";
        console.error('getAddress call reverted:', error);
        // Continue execution without the account address
    }

    console.log('Account address:', accountAddress);


    console.log("factoryContract", factoryContract.getFunction('getAddress'));



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


        await submitUserOperation(userOp);
    } catch (error) {
        console.error("Error processing event:", error);
    }
}

async function indexPastEvents(fromBlock: number) {
    console.log(`Indexing past events from block ${fromBlock}`);
    const events = await signetEmitterContract.queryFilter("SignetActionRequest", fromBlock);
    for (const event of events) {
        await processEvent(event);
    }
    console.log("Finished indexing past events");
}

async function startListening(fromBlock: number) {
    await indexPastEvents(fromBlock);

    signetEmitterContract.on("SignetActionRequest", (sender, userOp, event) => processEvent(event));
    console.log("Listening for new SignetActionRequest events...");
}

// Usage
const startBlockNumber = 123456; // Replace with your desired starting block number
startListening(startBlockNumber);




// 1. make sure that the txn is coming from a valid wallet and factory
// 2. create routes to CRUD factories
// 3. create local db table for key_service_factories
// 3. Create listeners for each supported destination chain
// 3. create routes to CRUD executed txns on destination chains
// 4. add chain_id for origin chain in current CRUD Routes
// 5. ensure that factory address and/or client_id is stored with destination txns

// v0.2
// 6. ensure valid way to mark whether client is paying via credit card or on chain via paymaster
//      if via paymaster there needs to be correct fee in userOp


// function _validatePaymasterUserOp(
//     UserOperation calldata userOp,
//     bytes32,
//     uint256
// )
//     internal
//     view
//     override
//     returns (bytes memory context, uint256 validationData)
// {
//     context = new bytes(0);
//     validationData = 0;

//     if (
//         bytes4(userOp.callData) !=
//         ISignetSmartWallet.executeWithoutChainIdValidation.selector
//     ) {
//         revert SelectorNotAllowed(bytes4(userOp.callData));
//     }

//     bytes[] memory calls = abi.decode(userOp.callData[4:], (bytes[]));

//     canExecuteViaPaymaster(calls);

//     address factoryAddress = ISignetSmartWallet(userOp.sender)
//         .deploymentFactoryAddress();

//     bytes[] memory deploymentOwners = ISignetSmartWallet(userOp.sender)
//         .getDeploymentOwners();

//     uint256 deploymentNonce = ISignetSmartWallet(userOp.sender)
//         .deploymentNonce();

//     // check for a valid factory
//     if (!validFactories[factoryAddress]) {
//         revert InvalidFactory(factoryAddress);
//     }

//     // call factory.getAddress() to check deterministic account address
//     address accountAddress = ISignetSmartWalletFactory(factoryAddress)
//         .getAddress(deploymentOwners, deploymentNonce);

//     // check that account was deployed by factory
//     if (accountAddress != userOp.sender) {
//         revert InvalidAccount(userOp.sender);
//     }
// }

// function _postOp(
//     PostOpMode mode,
//     bytes calldata context,
//     uint256 actualGasCost
// ) internal pure override {}

// /// @notice Returns whether `functionSelector` can be paid for by the paymaster.
// ///
// /// @param functionSelector The function selector to check.
// ////
// /// @return `true` is the function selector is allowed by paymaster, else `false`.
// function isValidFunction(
//     bytes4 functionSelector
// ) public pure returns (bool) {
//     if (
//         functionSelector == MultiOwnable.addOwnerPublicKey.selector ||
//         functionSelector == MultiOwnable.addOwnerAddress.selector ||
//         functionSelector == MultiOwnable.removeOwnerAtIndex.selector ||
//         functionSelector == MultiOwnable.removeLastOwner.selector ||
//         functionSelector == UUPSUpgradeable.upgradeToAndCall.selector
//     ) {
//         return true;
//     }
//     return false;
// }

// /// @notice Executes `calls` on this account (i.e. self call).
// ///
// /// @dev Can only be called by the Entrypoint.
// /// @dev Reverts if the given call is not authorized to skip the chain ID validtion.
// /// @dev `validateUserOp()` will recompute the `userOpHash` without the chain ID before validating
// ///      it if the `UserOperation.calldata` is calling this function. This allows certain UserOperations
// ///      to be replayed for all accounts sharing the same address across chains. E.g. This may be
// ///      useful for syncing owner changes.
// ///
// /// @param calls An array of calldata to use for separate self calls.
// function canExecuteViaPaymaster(bytes[] memory calls) public pure {
//     for (uint256 i; i < calls.length; i++) {
//         bytes memory call = calls[i];
//         bytes4 selector = bytes4(call);
//         if (!isValidFunction(selector)) {
//             revert SelectorNotAllowed(selector);
//         }
//     }
// }
// }
