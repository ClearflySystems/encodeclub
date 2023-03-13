import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { BigNumber, Contract, ethers, providers, utils, Wallet } from 'ethers';
import tokenJson from '../assets/MyToken.json';
import ballotJson from '../assets/BallotContract.json';

const API_URL = "http://localhost:3000"

declare global {
  interface Window {
    ethereum: import('ethers').providers.ExternalProvider;
  }
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  blockNumber: number = 0;
  ballotContractAddress: string | undefined;
  ballotContract: Contract | undefined;
  provider: ethers.providers.BaseProvider;
  transactions: string[];
  userWallet: Wallet | undefined;
  userEthBalance: number | string | undefined;
  userTokenBalance: number | string | undefined;
  tokenContractAddress: string | undefined;
  tokenContract: Contract | undefined;
  tokenTotalSupply: number | string | undefined;
  winningProposal: string | undefined;

  constructor(private http: HttpClient) {
    this.provider = new ethers.providers.AlchemyProvider('goerli', 'VY1fwTOfnvp2z1-ah4b5AmGz2x25xStj');
    this.transactions = [];
  }

  getTokenAddress() {
    return this.http.get<{address:string}>(`${API_URL}/token-contract`);
  }

  getBallotContract() {
    return this.http.get<{address:string}>(`${API_URL}/ballot-contract`);
  }

  getTokenBalance() {
    return this.http.get<{balance:string}>(`${API_URL}/balance/${this.userWallet?.address}`)
  }

  syncBlock() {
    this.provider.getBlock('latest').then( block => {
      this.blockNumber = block.number;
      //this.transactions = block.transactions;
    });
    this.getTokenAddress().subscribe((response)=>{
      this.tokenContractAddress = response.address;
      this.updateTokenInfo();
    });
    this.getBallotContract().subscribe((response) => {
      this.ballotContractAddress = response.address;
      this.ballotContract = new Contract(
        this.ballotContractAddress,
        ballotJson.abi,
        this.userWallet || this.provider
      )
    })
    if (this.userWallet) {
      this.getTokenBalance().subscribe((response) => {
        this.userTokenBalance = parseFloat(String(response));
      })
    }
  }

  updateTokenInfo(){
    if(! this.tokenContractAddress) return;
    this.tokenContract = new Contract(
      this.tokenContractAddress,
      tokenJson.abi,
      this.userWallet ?? this.provider
    );
    this.tokenTotalSupply = "loading..."
    this.tokenContract['totalSupply']().then((totalSupplyBN: BigNumber) =>{
      const totalSupplyStr = utils.formatEther(totalSupplyBN);
      this.tokenTotalSupply = parseFloat(totalSupplyStr)
    });
  }

  clearBlock() {
    this.blockNumber = 0;
    this.transactions = [];
  }

  async requestTokens(amount:string){
    this.userTokenBalance = "minting..."
    const signature = await this.userWallet?.signMessage(amount);
    const body = {
      address: this.userWallet?.address,
      amount: amount,
      signature: signature
    };
    return this.http
      .post<{result:string}>(`${API_URL}/request-tokens`, body)
      .subscribe(async (result) =>{
      console.log('tx hash ' + result.result);
      await this.updateTokenBalance();
    });
  }

  async updateTokenBalance(){
    if(! this.tokenContractAddress) return;
    this.tokenContract = new Contract(
      this.tokenContractAddress,
      tokenJson.abi,
      this.userWallet ?? this.provider
    );
    this.tokenContract['balanceOf'](this.userWallet?.address).then((balance:any) =>{
      console.log('token balance is '+ balance)
      this.userTokenBalance = balance;
    });
  }

  // function to vote
  async vote(_proposalIndex: string, _weight: string) {
    if (!this.ballotContract) {
      alert('You need to sync first')
    } else {
      if (!this.userWallet) {
        alert('Create a wallet first')
      } else {
        console.log(`Voting for proposal ${_proposalIndex} with weight ${_weight}`)
        const tx = await this.ballotContract.connect(this.userWallet!)['vote'](_proposalIndex, _weight, {
          gasLimit: 100000
        })
        console.log(`TX HASH ${tx.hash}`)
        const receipt = await tx.wait()
        console.log(`${receipt.status === 1 ? 'Success' : 'Failure'}`)
      }
    }
  }

  async delegate(_to: string) {
    if (!this.tokenContract) {
      alert('You need to sync first')
    } else {
      if (!utils.isAddress(_to)) alert('Not a valid address')
      else {
        console.log(`Delegating voting power to ${_to}`)
        const tx = await this.tokenContract['delegate'](_to, {gasLimit: 100000})
        console.log(`TX HASH ${tx.hash}`)
        const receipt = await tx.wait()
        console.log(`${receipt.status === 1 ? 'Success' : 'Failure'}`)
      }
    }
  }

  async getWinningProposal() {
    if (!this.ballotContract) {
      alert('You need to sync first')
    } else {
      const winnerAddress = await this.ballotContract['winnerName']();
      const winnerName = utils.parseBytes32String(winnerAddress)
      console.log(`The winning proposal is ${winnerName}`)
      this.winningProposal = winnerName;
    }
  }

  createWallet() {
    this.userWallet = Wallet.createRandom().connect(this.provider);
    this.userWallet.getBalance().then((balanceBN) =>{
      const balanceStr = utils.formatEther(balanceBN);
      this.userEthBalance = parseFloat(balanceStr)
    });
  }
}
