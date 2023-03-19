import {Component, ChangeDetectorRef} from '@angular/core';
import {metaMaskModule} from "./app.metamask";
import { BigNumber, Contract, ethers, providers, utils, Wallet } from 'ethers';

import tokenJson from '../assets/LotteryToken.json';
import lotteryJson from '../assets/LotteryContract.json';

import {environment} from "../../environments/environment";
const LOTTERY_TOKEN_ADDRESS = '0xcBe3930C2bA5A8247870E735972120e634F40Cd3';
const LOTTERY_CONTRACT_ADDRESS = '0xDd7925285d273AF86C460fB704A5345c0fB44631';
const TOKEN_RATIO = 1000000;

const BET_PRICE = 10;
const BET_FEE = 2;

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
        value: utils.parseEther(tokensRequired.toFixed(18)) // convert to WEI - ethers.utils.parseEther(amount).div(TOKEN_RATIO)
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
  async placeBets(amount:string = "10"){
    if(this.lotteryContract && this.tokenContract) {
      const state = await this.lotteryContract['betsOpen']();
      if (!state) {
        alert('lottery closed')
        return 
      }
      const signer = this.metaMask.getSigner()
      const allowanceBefore = await this.tokenContract['allowance'](await signer.getAddress(), this.tokenContractAddress)
      const betPrice = await this.lotteryContract['betPrice']()
      const betFee = await this.lotteryContract['betFee']()
      const requiredBalance = betPrice.add(betFee)
      let allowanceTxReceiptSuccess: boolean = false 
      if (allowanceBefore.eq(0)) {
        const allowTx = await this.tokenContract.connect(signer)['approve'](this.lotteryContractAddress, requiredBalance)
        const receipt = await allowTx.wait()
        allowanceTxReceiptSuccess = receipt.status === 1 ? true : false 
      } else if (allowanceBefore.lt(requiredBalance)) {
        const amountToIncrease = requiredBalance.sub(allowanceBefore)
        const allowTx = await this.tokenContract.connect(signer)['increaseAllowance'](this.lotteryContractAddress, amountToIncrease)
        const receipt = await allowTx.wait()
        allowanceTxReceiptSuccess = receipt.status === 1 ? true : false 
      } else { allowanceTxReceiptSuccess = true }

      if (!allowanceTxReceiptSuccess) {
        alert('There was an error while approving the lottery tokens')
        return 
      }

      const connectContract = this.lotteryContract.connect(signer);
      const tx = await connectContract['bet']();
      const rcpt = tx.wait();
      console.log(rcpt);
      await this.checkStatus();
    }
  }

  /**
   * Claim Prize Money amount
   * TODO
   */
  async claimPrize(){
    if(this.lotteryStatus.prizes == 0){
      alert('No claimable prizes - check for prizes first');
      return;
    }
    alert('Show me the Money!!!');
    if (this.lotteryContract) {
      const signer = this.metaMask.getSigner()
      const amount = this.lotteryStatus.prizes
      const tx = await this.lotteryContract.connect(signer)['prizeWithdraw'](amount)
      const receipt = await tx.wait()
      if (receipt.status === 1) alert(`Withdrawn prize of ${amount}`)
      else alert(`Failed to withdraw the prize of ${amount}`)
    }
    await this.checkStatus()
  }

  /**
   * Burn Token
   * TODO
   */
  async burnTokens(){
    if (this.lotteryContract && this.tokenContract) {
      alert('Burn baby burn!!!');
      const amount = utils.parseEther(this.lotteryStatus.tokens)
      const signer = this.metaMask.getSigner()
      // approve contract to burn
      const approveTx = await this.tokenContract.connect(signer)['approve'](this.lotteryContract.address, amount)
      let receipt = await approveTx.wait()
      if (receipt.status === 1) {
        const tx = await this.lotteryContract.connect(signer)['returnTokens'](amount)
        receipt = await tx.wait()
        if (receipt.status === 1) alert(`Burned ${amount} tokens for Ether`)
        else alert(`Failed to burn ${amount} tokens`)
      } else alert(`Failed to approve ${amount} tokens`)
      await this.checkStatus();
    }
  }

  /**
   * Owner pool/fees withdrawl
   */
  async withdrawTokens(){
    alert('Show me the Money!!!');
    if (!this.lotteryStatus.owner) {
      alert('Only the owner can withdraw tokens')
    } else {
      const signer = this.metaMask.getSigner()
      if (this.lotteryContract) {
        const amountToWithdraw = this.lotteryStatus.ownerpool
        const tx = await this.lotteryContract.connect(signer)['ownerWithdraw'](amountToWithdraw)
        const receipt = await tx.wait()
        if (receipt.status === 1) alert(`Successfully withdrawn ${amountToWithdraw}`)
        else alert(`Failed to withdraw ${amountToWithdraw}`)
      }
    }
    await this.checkStatus()
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
