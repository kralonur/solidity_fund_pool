//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

/**
    @title A fundraising contract
    @author Me
    A contract which has multiple pools to raise funds.
    Each pool has owner which gets the funds at the end.
*/
contract Fund {
    /// Constant name for the contract
    string public name = "FundRaise v1.0";

    /// Overall funds in this contract ever collected
    uint256 public totalFundsCollected;

    /// Overall funds in active pools
    uint256 public totalActiveFunds;

    /**
        An enum that stores the state of the pool.
        @param INACTIVE pool is not been created.
        @param ACTIVE pool has been created.
        @param COMPLETED pool has been finalised. 
    */
    enum FundState {
        INACTIVE,
        ACTIVE,
        COMPLETED
    }

    /**
        A struct which stores information about the funds.
        @param state whether the pool is active.
        @param amounts external address to funded amount.
        @param funders the iteratable collection of addresses.
        @param fundOwner the owner of the funds in that pool.
        @param totalFundedAmount the total collected funds.
    */
    struct FundRaise {
        FundState state;
        mapping(address => uint256) amounts;
        address[] funders;
        address fundOwner;
        uint256 totalFundedAmount;
    }

    /// A mapping for storing pools to FundRaise
    mapping(uint256 => FundRaise) public fundRaises;

    /// A variable that stores the current index of the new pool
    uint256 public fundIndex;
}
