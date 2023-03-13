import {ForbiddenException, Injectable} from '@nestjs/common';
import { ethers } from 'ethers';
import * as helpers from "./helpers";
import { PaymentOrder } from './models/paymentOrder.model';
import * as tokenJson from './assets/MyToken.json';
import * as ballotJson from './assets/Ballot.json';
import * as dotenv from 'dotenv';
dotenv.config();

const TOKEN_CONTRACT_ADDRESS = '0x501761b004AA21C8045b00E54925e855D553e83b';
const BALLOT_CONTRACT_ADDRESS = '0xa61958f81918672533CF4cCa4acfca38833c4392';

@Injectable()
export class AppService {
  provider: ethers.providers.Provider;
  signer: ethers.Wallet;
  tokenContract: ethers.Contract;
  ballotContract: ethers.Contract;
  paymentOrders: PaymentOrder[];

  /**
   * Init Class Vars
   */
  constructor() {
    // Check Private Key
    const privateKey = helpers.getRequiredEnvVar('PRIVATE_KEY', 'Missing or Invalid Private Key.');
    // Define Alchemy provider
    this.provider = helpers.getTestnetProvider(1); //ethers.getDefaultProvider('goerli');
    // Connect Signer Wallet
    this.signer = helpers.getConnectedSignerWallet(privateKey, this.provider);
    // Define Token Contact
    this.tokenContract = new ethers.Contract(
        TOKEN_CONTRACT_ADDRESS,
        tokenJson.abi,
        this.provider
    );
    // Define Ballot Contact
    this.ballotContract = new ethers.Contract(
        BALLOT_CONTRACT_ADDRESS,
        ballotJson.abi,
        this.provider
    );
    this.paymentOrders = [];
  }

  /**
   * Return My Token Contract Address
   */
  getTokenContractAddress(): string {
    return TOKEN_CONTRACT_ADDRESS;
  }
  /**
   * Return Ballot Contract Address
   */
  getBallotContractAddress(): string {
    return BALLOT_CONTRACT_ADDRESS;
  }

  /**
   * Return the Total Supply of Tokens in contract
   */
  async getTotalSupply(): Promise<number> {
    const totalSupplyBN = await this.tokenContract.totalSupply();
    const totalSupplyString = ethers.utils.formatEther(totalSupplyBN);
    return parseFloat(totalSupplyString);
  }

  /**
   * Get Balance of Tokens minted to an address
   * @param address
   */
  async getBalance(address: string): Promise<string> {
    const balance = await this.tokenContract.balanceOf(address);
    console.log(`Requested balance for ${address}, balance = ${balance.toString()}`)
    return ethers.utils.formatEther(balance);
  }

  /**
   * Return the allowance between two addresses
   * @param from
   * @param to
   */
  async getAllowance(from: string, to: string): Promise<number> {
    const allowanceBN = await this.tokenContract.allowance(from, to);
    const allowanceString = ethers.utils.formatEther(allowanceBN);
    return parseFloat(allowanceString);
  }

  /**
   * Return the status of a transaction hash
   * @param hash
   */
  async getTransactionStatus(hash: string): Promise<string> {
    const tx = await this.provider.getTransaction(hash);
    const txRcpt = await tx.wait();
    return txRcpt.status == 1 ? 'Completed' : 'Reverted';
  }

  /**
   * Request Voting Tokens to be minted
   * @param address
   * @param amount
   * @param signature
   */
  async requestTokens(address: string, amount: number, signature: string) {
    // Get message signers address
    if(signature != '') {
      const signerAddr = ethers.utils.verifyMessage(amount.toString(), ethers.utils.hexlify(signature));
      if (signerAddr != address) {
        throw new Error('Invalid message signature');
      }
    }
    const tx = await this.tokenContract.connect(this.signer).mint(address, amount, {
      gasLimit: 100000
    });
    const receipt = await tx.wait()
    if (receipt.status === 0){
      throw new Error(`Transaction failed: ${tx.hash}`)
    }
    console.log(`Minted ${amount} tokens to ${address} at block ${receipt.blockNumber}`)
    return tx.hash;
  }

  /**
   * Return Winning Proposal
   */
  async getWinningProposal(): Promise<string> {
    const winnerAddress = await this.ballotContract.connect(this.signer).winnerName();
    return ethers.utils.parseBytes32String(winnerAddress);
  }

  /**
   * Return list of all payment orders
   */
  getPaymentOrders() {
    return this.paymentOrders;
  }

  /**
   * Create a new payment order
   * @param value
   * @param secret
   */
  createPaymentOrder(value: number, secret: string): number {
    const newPaymentOrder = new PaymentOrder();
    newPaymentOrder.value = value;
    newPaymentOrder.secret = secret;
    newPaymentOrder.id = this.paymentOrders.length;
    this.paymentOrders.push(newPaymentOrder);
    return newPaymentOrder.id;
  }

  /**
   * Fulfil a payment order and mint tokens
   * @param id
   * @param secret
   * @param address
   */
  async fulfillPaymentOrder(id: number, secret: string, address: string) {
    // Find payment order by id and secret
    const paymentOrder = this.paymentOrders.find( p =>
      p.id == id && p.secret == secret
    );
    // Check PaymentOrder found
    if(!paymentOrder){
      throw new ForbiddenException('Invalid Payment ID or Secret');
    }
    // Connect and Mint
    const tx = await this.tokenContract
        .connect(this.signer)
        .mint(
            address,
            ethers.utils.parseEther(paymentOrder.value.toString())
        );
    // Get Transaction receipt
    const txRcpt = await tx.wait();
    console.log( txRcpt );
  }

  /**
   * Return Hello World
   */
  getHello(): string {
    return 'Hello World!';
  }
}
