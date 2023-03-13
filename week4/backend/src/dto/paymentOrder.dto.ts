export class CreatePaymentOrderDTO {
    secret: string;
    value: number;
}

export class RequestTokensDTO{
    address:string;
    amount:number;
    signature:string;
}

export class CastVoteRequestDTO{
    proposalIndex:number;
    votingPower:number;
    privateKey:string;
}

export class ContractAddressResponse{
    address:string;
}

export class MintTokenResponse{
    result:string;
}

export class CastVoteResponse{
    result:string;
}

export class WinningProposalResponse{
    result:string;
}