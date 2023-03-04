// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <0.9.0;

interface IMyToken {
    function getPastVotes(address account, uint256 blocknumber) external view returns(uint256);
}

contract Ballot {
    struct Proposal {
        bytes32 name;   // short name (up to 32 bytes)
        uint voteCount; // number of accumulated votes
    }
    uint256 public targetBlockNumber;
    IMyToken public tokenContract;
    Proposal[] public proposals;

    constructor(bytes32[] memory proposalNames, address _tokenContact, uint256 _targetBlockNumber) {
        tokenContract = IMyToken(_tokenContact);
        targetBlockNumber = _targetBlockNumber;
        for (uint i = 0; i < proposalNames.length; i++) {
            proposals.push(Proposal({
            name: proposalNames[i],
            voteCount: 0
            }));
        }
    }

    function vote(uint proposal, uint256 amount) external {
        require(votingPower(msg.sender) >= amount);
        proposals[proposal].voteCount+= amount;
        // require sender to have voting power

    }

    function votingPower(address account) public view returns (uint256)  {
        return tokenContract.getPastVotes(account, targetBlockNumber);
    }

    function winningProposal() public view
    returns (uint winningProposal_)
    {
        uint winningVoteCount = 0;
        for (uint p = 0; p < proposals.length; p++) {
            if (proposals[p].voteCount > winningVoteCount) {
                winningVoteCount = proposals[p].voteCount;
                winningProposal_ = p;
            }
        }
    }

    function winnerName() external view
    returns (bytes32 winnerName_)
    {
        winnerName_ = proposals[winningProposal()].name;
    }
}
