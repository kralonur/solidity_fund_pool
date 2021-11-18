//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
    @title A fundraising contract
    @author Me
    A contract which has multiple pools to raise funds.
    Each pool has owner which gets the funds at the end.
*/
contract Fund is Ownable {
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

    /**
        A modifier that checks if the pool id is valid.
        @param _poolId ID of the pool.
     */
    modifier onlyValidPool(uint256 _poolId) {
        // Since pool with address(0) cannot exist
        require(
            fundRaises[_poolId].fundOwner != address(0),
            "This pool does NOT exists!"
        );
        _;
    }

    /**
        Deploys to network.
        @param _owner contract owner.
    */
    constructor(address _owner) {
        require(_owner != address(0), "Owner adress cannot be zero!");
        transferOwnership(_owner);
    }

    /**
        A function that creates a funding pool.
        @param _fundOwner owner of the funds in the pool.
    */
    function createFundPool(address _fundOwner) external onlyOwner {
        require(_fundOwner != address(0), "Fund owner adress cannot be zero!");
        fundRaises[fundIndex++].fundOwner = _fundOwner;
    }

    /**
        A function that launches the pool.
        @param _poolId pool ID to launch.
    */
    function launchFundPool(uint256 _poolId)
        external
        onlyOwner
        onlyValidPool(_poolId)
    {
        require(
            fundRaises[_poolId].state == FundState.INACTIVE,
            "Fund state has to be inactive to launch!"
        );
        fundRaises[_poolId].state = FundState.ACTIVE;
    }

    /**
        A function that finishes the pool.
        @param _poolId pool ID to finish.
    */
    function finishFundPool(uint256 _poolId)
        external
        onlyOwner
        onlyValidPool(_poolId)
    {
        require(
            fundRaises[_poolId].state == FundState.ACTIVE,
            "Fund state is not active!"
        );
        FundRaise storage fundRaise = fundRaises[_poolId];
        uint256 totalFundedAmount = fundRaise.totalFundedAmount;
        fundRaise.totalFundedAmount = 0;
        fundRaise.state = FundState.COMPLETED;
        totalActiveFunds -= totalFundedAmount;
        payable(fundRaise.fundOwner).transfer(totalFundedAmount);
    }

    /**
        A function that changes the owner of the funding pool.
        @param _poolId pool ID to change the owner of.
        @param _newFundOwner address of the new owner.
    */
    function changeFundOwner(uint256 _poolId, address _newFundOwner)
        external
        onlyOwner
        onlyValidPool(_poolId)
    {
        require(
            _newFundOwner != address(0),
            "Fund owner adress cannot be zero!"
        );
        FundRaise storage fundRaise = fundRaises[_poolId];
        fundRaise.fundOwner = _newFundOwner;
    }

    /**
        A function that is used to fund the pool.
        @param _poolId pool ID to fund.
    */
    function fund(uint256 _poolId) external payable onlyValidPool(_poolId) {
        require(
            fundRaises[_poolId].state == FundState.ACTIVE,
            "Fund state is not active!"
        );
        FundRaise storage fundRaise = fundRaises[_poolId];
        if (fundRaise.amounts[msg.sender] == 0) {
            fundRaise.funders.push(msg.sender);
        }
        fundRaise.amounts[msg.sender] += msg.value;
        fundRaise.totalFundedAmount += msg.value;
        totalActiveFunds += msg.value;
        totalFundsCollected += msg.value;
    }

    /**
        A function that return pool information.
        @param _poolId pool ID to get information from.
        @return pool information as return value.
    */
    function getPoolInfo(uint256 _poolId)
        external
        view
        onlyValidPool(_poolId)
        returns (
            FundState,
            address[] memory,
            address,
            uint256
        )
    {
        FundRaise storage fundRaise = fundRaises[_poolId];
        return (
            fundRaise.state,
            fundRaise.funders,
            fundRaise.fundOwner,
            fundRaise.totalFundedAmount
        );
    }
}
