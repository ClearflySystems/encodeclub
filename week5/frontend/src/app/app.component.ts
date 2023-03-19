import {Component, ChangeDetectorRef} from '@angular/core';
import {metaMaskModule} from "./app.metamask";
import { BigNumber, Contract, ethers, providers, utils, Wallet } from 'ethers';

import tokenJson from '../assets/LotteryToken.json';
import lotteryJson from '../assets/LotteryContract.json';

import {environment} from "../../environments/environment";
const LOTTERY_TOKEN_ADDRESS = '0xf3124cdFa75B15ca2f0f18F2E9F962FE387d8f01';//'0xa85cddc8308F870A4f365C9D7e4778eDA14F7590';
const LOTTERY_CONTRACT_ADDRESS = '0x7Cf2139aA78de20CCd0Ec2Db5108472f85eDE763';

const BET_PRICE = 10;
const BET_FEE = 2;
const TOKEN_RATIO = 100;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent{
  metaMask: metaMaskModule;
  defaultProvider: providers.Provider;
  tokenContractAddress: string;
  tokenContract: Contract | undefined;
  lotteryContractAddress: string;
  lotteryContract: Contract | undefined;
  lotteryStatus: any



  /**
   * App Component Constructor
   * @param cdr
   */
  constructor(private cdr: ChangeDetectorRef) {
    // Define our MetaMask Wallet Provider with angular view updater as callback
    this.metaMask = new metaMaskModule(() => this.refreshUI());
    // Setup a Metamask Web3 provider
    this.defaultProvider = this.metaMask.web3provider;
    //this.defaultProvider = new ethers.providers.AlchemyProvider('goerli', environment.ALCHEMY_API_KEY);

    // Set Contract Addresses
    this.tokenContractAddress = LOTTERY_TOKEN_ADDRESS;
    this.lotteryContractAddress = LOTTERY_CONTRACT_ADDRESS;

    // Set Token Contract Object
    this.tokenContract = new Contract(
      this.tokenContractAddress,
      tokenJson.abi,
      this.defaultProvider
    );

    // Set Lottery Contract Object
    this.lotteryContract = new Contract(
      this.lotteryContractAddress,
      lotteryJson.abi,
      this.defaultProvider
    );

    // Object to store lottery status view vars
    this.lotteryStatus = {
      owner: '',
      state: 0,
      tokens: 0,
      prizes: 0,
      ownerpool: 0,
      currentBlockDate: 'N/A',
      closingTimeDate: 'N/A',
      loading: 0
    }

    this.checkStatus();
  }

  /**
   * Get Lottery Status and closing date/time
   */
  async checkStatus(){
    if(this.lotteryContract) {
      this.lotteryStatus.state = 3;
      this.lotteryStatus.loading = 1;
      console.log('Getting Contract State');
      const state = await this.lotteryContract['betsOpen']();
      this.lotteryStatus.state = state? 1 : 2;
      if (state) {
        // TODO get closing date direct from contract
        const currentBlock = await this.defaultProvider.getBlock("latest");
        const closingTime = await this.lotteryContract['betsClosingTime']();
        this.lotteryStatus.currentBlockDate = new Date(currentBlock.timestamp * 1000);
        this.lotteryStatus.closingTimeDate = new Date(closingTime.toNumber() * 1000);
      }
      // Get Token Balance
      if(this.tokenContract) {
        this.tokenContract['balanceOf'](this.metaMask.userWalletAddress).then((balance:BigNumber) => {
          this.lotteryStatus.tokens = utils.formatEther(balance);
        });
      }

      // Are we the owner
      const owner = await this.lotteryContract['owner']();
      this.lotteryStatus.owner = owner.toString().toLowerCase() == this.metaMask.userWalletAddress.toString().toLowerCase();

      // Get Ownerpool fund
      if(this.lotteryStatus.ownerpool){
        this.lotteryContract['ownerPool']().then((balance:BigNumber) => {
          this.lotteryStatus.ownerpool = utils.formatEther(balance);
        });
      }

      this.lotteryStatus.loading = 0;
    }else{
      this.displayError('Error with LotteryContract');
    }
  }

  /**
   * Open Lottery for placing bets
   * @param datetime
   */
  async openBets( datetime: any ){
    const now = new Date();
    const closing = Date.parse(datetime);
    if(isNaN(closing) || closing < (now.getTime() + 600000)){
      this.displayError('Please set a date/time that is in the future and more than 10 minutes');
    }else{
      this.lotteryStatus.loading = 1;
      try {
        const connectContract = this.getLotteryContractOwnerSigned();
        const tx = await connectContract['openBets']( closing / 1000, {
          gasLimit:100000
        });
        const rcpt = await tx.wait();
        console.log(rcpt);
        await this.checkStatus();
      }catch (e){
        this.displayError(e);
      }
    }
  }

  /**
   * Purchase Lottery Tokens from MetaMask Wallet
   */
  async buyTokens(amount:string = "1"){
    let tokensOrdered = parseFloat(amount);
    let tokensRequired = tokensOrdered / TOKEN_RATIO;
    if(!tokensOrdered || isNaN(tokensOrdered) || tokensOrdered == 0){
      this.displayError('Invalid Token Amount');
      return;
    }
    try {
      this.lotteryStatus.loading = 1;
      const connectContract = this.getLotteryContractOwnerSigned();
      const tx = await connectContract['purchaseTokens']({
        value: utils.parseEther(tokensRequired.toFixed(18)) // convert to WEI
      });
      const rcpt = await tx.wait();
      console.log(rcpt);
      await this.checkStatus();
    }catch (e){
      this.displayError(e);
    }
  }

  /**
   * Close Lottery to any further bets
   */
  async closeLottery(){
    if(!this.lotteryStatus.closingTimeDate){
      return;
    }
    const now = new Date();
    const closing = Date.parse(this.lotteryStatus.closingTimeDate);
    if(closing > now.getTime()){
      this.displayError('Can not be close until after: ' + this.lotteryStatus.closingTimeDate);
      return;
    }
    try {
      this.lotteryStatus.loading = 1;
      const connectContract = this.getLotteryContractOwnerSigned();
      const tx = await connectContract['closeLottery']({
        gasLimit:100000
      });
      const rcpt = await tx.wait();
      console.log(rcpt);
      await this.checkStatus();
    }catch (e){
      this.displayError(e);
    }
  }

  /**
   * Check Prizes mapping for user address for any claimable BLT
   */
  async displayPrize(){
    try {
      if(this.lotteryContract) {
        this.lotteryContract['prize'](this.metaMask.userWalletAddress).then((balance:BigNumber) => {
          this.lotteryStatus.prizes = utils.formatEther(balance);
          alert('Prize total for your address: ' + this.lotteryStatus.prizes);
        });
      }
    }catch (e){
      this.displayError(e);
    }
  }

  /**
   * Place Bet with account
   * TODO
   * @param amount
   */
  placeBets(amount:string = "10"){
    alert('Place yer bets');
  }

  /**
   * Claim Prize Money amount
   * TODO
   */
  claimPrize(){
    if(this.lotteryStatus.prizes == 0){
      alert('No claimable prizes - check for prizes first');
      return;
    }
    alert('Show me the Money!!!');
  }

  /**
   * Burn Token
   * TODO
   */
  burnTokens(){
    alert('Burn baby burn!!!');
  }

  /**
   * Owner pool/fees withdrawl
   */
  withdrawTokens(){
    alert('Show me the Money!!!');
  }

  /**
   * Get Lottery Contract with Owner as Signer for Read/Write operations
   */
  getLotteryContractOwnerSigned(){
    if(this.lotteryContract){
      return this.lotteryContract.connect( this.metaMask.getSigner() );
    }else{
      throw new Error('Error with Lottery Contract');
    }
  }

  /**
   * Getter for Lottery Status Label
   */
  getLotterStateLabel(){
    switch(this.lotteryStatus.state){
      case 1: return 'Open';
      case 2: return 'Closed';
      case 3: return 'Checking';
      default: return 'Unknown';
    }
  }

  /**
   * Callback function to refresh angular UI after external updates.
   */
  async refreshUI(){
    if(this.lotteryStatus.state !== 0){
      await this.checkStatus();
    }
    this.cdr.detectChanges();
  }

  /**
   * Display Error - todo add Toast/Alert
   */
  displayError(e:any){
    this.lotteryStatus.loading = 0;
    alert(e);
  }
}
