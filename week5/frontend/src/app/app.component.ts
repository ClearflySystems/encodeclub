import {Component, ChangeDetectorRef} from '@angular/core';
import {metaMaskModule} from "./app.metamask";
import { BigNumber, Contract, ethers, providers, utils, Wallet } from 'ethers';

import tokenJson from '../assets/LotteryToken.json';
import lotteryJson from '../assets/LotteryContract.json';

const LOTTERY_TOKEN_ADDRESS = '0xcBe3930C2bA5A8247870E735972120e634F40Cd3';
const LOTTERY_CONTRACT_ADDRESS = '0xDd7925285d273AF86C460fB704A5345c0fB44631';
const TOKEN_RATIO = 1000000;

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
  lotteryStatus: any;
  tokenRatio: number;



  /**
   * App Component Constructor
   * @param cdr
   */
  constructor(private cdr: ChangeDetectorRef) {
    // Define our MetaMask Wallet Provider with angular view updater as callback
    this.metaMask = new metaMaskModule(() => this.refreshUI());

    // Setup a Metamask Web3 provider
    this.defaultProvider = this.metaMask.web3provider;

    // Set Contract Addresses
    this.tokenContractAddress = LOTTERY_TOKEN_ADDRESS;
    this.lotteryContractAddress = LOTTERY_CONTRACT_ADDRESS;
    this.tokenRatio = TOKEN_RATIO;

    // Object to store lottery status view vars
    this.lotteryStatus = {
      owner: '',
      state: 1,
      tokens: 0,
      prizes: 0,
      ownerpool: 0,
      prizepool: 0,
      currentBlockDate: 'N/A',
      closingTimeDate: 'N/A',
      loading: 0
    }
  }

  /**
   * Init Contracts only if Goerli Network
   */
  initContracts(){
    if(!this.lotteryContract) {
      console.log('Setup Contracts');
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
    }
  }

  /**
   * Get Lottery Status and closing date/time
   */
  async checkStatus(){
    if(!this.metaMask.isConnectedToGoerli()){
      return;
    }
    this.initContracts();
    if(this.lotteryContract) {
      this.lotteryStatus.state = 3;
      this.lotteryStatus.loading = 1;
      console.log('Getting Contract State');
      const state = await this.lotteryContract['betsOpen']();
      this.lotteryStatus.state = state? 1 : 2;
      if (state) {
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

      // Get Ownerpool / Prizepool funds
      this.lotteryContract['ownerPool']().then((balance:BigNumber) => {
        this.lotteryStatus.ownerpool = utils.formatEther(balance);
      });

      this.lotteryContract['prizePool']().then((balance:BigNumber) => {
        this.lotteryStatus.prizepool = utils.formatEther(balance);
      });

      this.lotteryStatus.loading = 0;
      this.cdr.detectChanges();
    }else{
      this.displayError('Error with LotteryContract');
    }
  }

  /**
   * Open Lottery for placing bets
   * @param datetime
   */
  async openLottery( datetime: any ){
    const now = new Date();
    const closing = Date.parse(datetime);
    if(isNaN(closing) || closing < (now.getTime() + 600000)){
      this.displayError('Please set a date/time that is in the future and more than 10 minutes');
    }else{
      this.lotteryStatus.loading = 1;
      try {
        const connectedLotteryContract = this.getLotteryContractOwnerSigned();
        const tx = await connectedLotteryContract['openBets']( closing / 1000, {
          gasLimit:100000
        });
        const receipt = await tx.wait();
        console.log(receipt);
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
      const connectedLotteryContract = this.getLotteryContractOwnerSigned();
      const tx = await connectedLotteryContract['purchaseTokens']({
        value: utils.parseEther(tokensRequired.toFixed(18)) // convert to WEI - ethers.utils.parseEther(amount).div(TOKEN_RATIO)
      });
      const receipt = await tx.wait();
      console.log(receipt);
      await this.metaMask.refreshWallet();
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
      const connectedLotteryContract = this.getLotteryContractOwnerSigned();
      const tx = await connectedLotteryContract['closeLottery']({
        gasLimit:1000000
      });
      const receipt = await tx.wait();
      console.log(receipt);
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
   * Place Bet with account as number of entries
   * @param amount
   */
  async placeBets(amount:string = "10"){
    // check we have Tokens first
    if(this.lotteryStatus.tokens <= 0){
      alert('You need to buy Lottery Tokens first.');
      return;
    }
    // Connect Signer to contracts
    const connectedLotteryContract = this.getLotteryContractOwnerSigned();
    const connectedTokenContract = this.getTokenContractOwnerSigned();
    // Check Lottery still open
    const state = await connectedLotteryContract['betsOpen']();
    if (!state) {
      alert('lottery closed');
      return;
    }
    // Limit entries
    let entries = parseInt(amount) | 1;
    entries = Math.min(entries, 10);// Limit to 10
    // Set as busy
    this.lotteryStatus.loading = 1;
    let allowanceTxReceiptSuccess: boolean = false;
    // Calculate required balance to approve
    const allowanceBefore = await connectedTokenContract['allowance'](
      await this.metaMask.getSigner().getAddress(),
      this.tokenContractAddress
    );
    const betPrice = await connectedLotteryContract['betPrice']();
    const betFee = await connectedLotteryContract['betFee']();
    const requiredBalance = betPrice.add(betFee).mul(entries);
    // Approve or increase allowances - via Metamask
    if (allowanceBefore.eq(0)) {
      const allowTx = await connectedTokenContract['approve'](this.lotteryContractAddress, requiredBalance);
      const receipt = await allowTx.wait();
      allowanceTxReceiptSuccess = receipt.status === 1;
    } else if (allowanceBefore.lt(requiredBalance)) {
      const amountToIncrease = requiredBalance.sub(allowanceBefore);
      const allowTx = await connectedTokenContract['increaseAllowance'](this.lotteryContractAddress, amountToIncrease);
      const receipt = await allowTx.wait();
      allowanceTxReceiptSuccess = receipt.status === 1;
    } else {
      allowanceTxReceiptSuccess = true;
    }
    // Approval failes
    if (!allowanceTxReceiptSuccess) {
      this.displayError('There was an error while approving the lottery tokens');
      return;
    }
    // Place multiple bets
    const tx = await connectedLotteryContract['betMany'](entries);
    const receipt = await tx.wait();
    console.log(receipt);
    await this.metaMask.refreshWallet();
  }

  /**
   * Claim Prize Money amount
   */
  async claimPrize(){
    if(this.lotteryStatus.prizes == 0){
      alert('No claimable prizes - check for prizes first');
      return;
    }
    this.lotteryStatus.loading = 1;
    const amountToWithdraw = utils.parseEther(this.lotteryStatus.prizes);
    const connectedLotteryContract = this.getLotteryContractOwnerSigned();
    const tx = await connectedLotteryContract['prizeWithdraw'](amountToWithdraw);
    const receipt = await tx.wait();
    if (receipt.status === 1) {
      alert(`Withdrawn prize of ${amountToWithdraw}`);
      await this.metaMask.refreshWallet();
    } else {
      this.displayError(`Failed to withdraw the prize of ${amountToWithdraw}`);
    }
  }

  /**
   * Burn Token
   */
  async burnTokens(){
    // Connect Signer to contracts
    const connectedLotteryContract = this.getLotteryContractOwnerSigned();
    const connectedTokenContract = this.getTokenContractOwnerSigned();
    this.lotteryStatus.loading = 1;
    const amount = utils.parseEther(this.lotteryStatus.tokens);
    // approve contract to burn
    const approveTx = await connectedTokenContract['approve'](connectedLotteryContract.address, amount);
    let receipt = await approveTx.wait();
    if (receipt.status === 1) {
      const tx = await connectedLotteryContract['returnTokens'](amount);
      receipt = await tx.wait();
      if (receipt.status === 1) {
        alert(`Burned ${amount} tokens for Ether`);
      }
      else {
        alert(`Failed to burn ${amount} tokens`);
      }
    } else {
      alert(`Failed to approve ${amount} tokens`);
    }
    await this.metaMask.refreshWallet();
  }

  /**
   * Owner pool/fees withdrawl
   */
  async withdrawTokens(){
    if (!this.lotteryStatus.owner) {
      alert('Only the owner can withdraw tokens');
    } else {
      const amountToWithdraw = utils.parseEther(this.lotteryStatus.ownerpool);
      const connectedLotteryContract = this.getLotteryContractOwnerSigned();
      const tx = await connectedLotteryContract['ownerWithdraw'](amountToWithdraw);
      const receipt = await tx.wait();
      if (receipt.status === 1) {
        alert(`Successfully withdrawn ${amountToWithdraw}`);
      } else {
        alert(`Failed to withdraw ${amountToWithdraw}`);
      }
      await this.metaMask.refreshWallet();
    }
  }

  /**
   * Transfer Lottery Contract Ownership to new address
   * @param address
   */
  async transferOwnership(address:string) {
    if(address && utils.isAddress(address)){
      this.lotteryStatus.loading = 1;
      const connectedLotteryContract = this.getLotteryContractOwnerSigned();
      const tx = await connectedLotteryContract['transferOwnership'](address, {
        gasLimit:100000
      });
      const rcpt = await tx.wait();
      console.log(rcpt);
      await this.checkStatus();
    }else{
      this.displayError('Invalid Transfer Address');
    }
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
   * Get Lottery Token Contract with Owner as Signer for Read/Write operations
   */
  getTokenContractOwnerSigned(){
    if(this.tokenContract){
      return this.tokenContract.connect( this.metaMask.getSigner() );
    }else{
      throw new Error('Error with Token Contract');
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
