import { Controller, Body, Get, Post, Query, Param } from '@nestjs/common';
import { AppService } from "./app.service";
import { PaymentOrder } from './models/paymentOrder.model';
import {
  MintTokenResponse,
  RequestTokensDTO,
  WinningProposalResponse,
  CreatePaymentOrderDTO,
  ContractAddressResponse
} from './dto/paymentOrder.dto';


@Controller()
export class AppController {

  constructor(private readonly appService: AppService) {
    this.appService = appService;
  }

  @Get("token-contract")
  getTokenContractAddress(): ContractAddressResponse {
    const r = new ContractAddressResponse();
    r.address = this.appService.getTokenContractAddress();
    return r;
  }

  @Get("ballot-contract")
  getBallotContractAddress(): ContractAddressResponse {
    const r = new ContractAddressResponse();
    r.address = this.appService.getBallotContractAddress();
    return r;
  }

  @Get("total-supply")
  async getTotalSupply(): Promise<number> {
    return await this.appService.getTotalSupply();
  }

  @Get('balance/:address')
  async getBalance(@Param('address') address:string): Promise<string> {
    return this.appService.getBalance(address);
  }

  @Get("allowance")
  async getAllowance(
      @Query('from') from: string,
      @Query('to') to: string,
  ): Promise<number> {
    return await this.appService.getAllowance(from, to);
  }

  @Get("transaction-status")
  async getTransactionStatus(
      @Query('hash') hash: string
  ): Promise<string> {
    return await this.appService.getTransactionStatus(hash)
  }

  @Post('request-tokens')
  async requestTokens(@Body() body: RequestTokensDTO): Promise<MintTokenResponse> {
    const mintTokenResponse:MintTokenResponse = new MintTokenResponse();
    mintTokenResponse['result'] = await this.appService.requestTokens(body.address, body.amount, body.signature);
    return mintTokenResponse;
  }

  @Get('winning-proposal')
  async getWinningProposal(): Promise<WinningProposalResponse> {
    const winningProposalResponse:WinningProposalResponse = new WinningProposalResponse();
    winningProposalResponse['result'] = await this.appService.getWinningProposal();
    return winningProposalResponse;
  }

  @Get("payment-orders")
  getPaymentOrders(): PaymentOrder[] {
    return this.appService.getPaymentOrders();
  }

  @Post("payment-order")
  createPaymentOrder(@Body() body: CreatePaymentOrderDTO) {
    return this.appService.createPaymentOrder(
        body.value, body.secret
    );
  }

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}
