import * as helpers from "./helpers";
import * as dotenv from 'dotenv';
import { MyToken__factory } from "../typechain-types";
import { utils } from "ethers";
dotenv.config();

/**
 * yarn run ts-node --files ./scripts/DelegateVote_4.ts "tokenContractAddress" "delegatedVoterAddress" 
 */
async function main() {

    // Check Contract Address passed
    const ballotContractAddress = helpers.getRequiredArg(0, "Missing Ballot contract address parameter");

    // Check Delegated voter address passed
    const delegatedVoterAddress = helpers.getRequiredArg(1, "Missing Delegated voter address parameter");
    if (!utils.isAddress(delegatedVoterAddress)) throw new Error("Not a valid EVM address")
    console.log(`delegatedVoterAddress is ${delegatedVoterAddress}`);

    // Get Provider
    const provider = helpers.getTestnetProvider(1);

    // Check Private Key and connect Signer Wallet
    const privateKey = helpers.getRequiredEnvVar('PRIVATE_KEY');
    const signer = helpers.getConnectedSignerWallet(privateKey, provider);

    // Delegate My Vote to Voter
    const contract = new MyToken__factory(signer).attach(ballotContractAddress)
    const tx = await contract.delegate(delegatedVoterAddress, {gasLimit: 100000})
    const receipt = await tx.wait()

    if (receipt.status === 0) throw new Error(`Transaction failed: ${tx.hash}`)
    
    console.log(`Delegated vote to ${delegatedVoterAddress} from ${signer.address} at block ${receipt.blockNumber}`)
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
