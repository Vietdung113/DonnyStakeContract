// SPDX-License-Identifier: MIT
// WARNING this contract has not been independently tested or audited
// DO NOT use this contract with funds of real value until officially tested and audited by an independent expert or group

pragma solidity ^0.8.11;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract StakeContract {
    // boolean to prevent reentrancy
    bool internal locked;

    // Library usage
    using SafeERC20 for IERC20;
    using SafeMath for uint256;

    // Contract owner
    address public owner;

    // Token amount variables
    // mapping(address => uint256) public alreadyWithdrawn;
    // mapping(address => uint256) public balances;
    struct Stake {
        address author;
        IERC20 token;
        uint256 balance;
        uint256 balanceToWithdraw;
        uint256 initTime;
        uint256 withdrawTime;
    }
    uint256 stakeIdCounter;
    mapping(uint256 => Stake) public stakes;

    // Options for time period (in seconds)
    uint256[4] timePeriods = [
        2592000, // 30 days - 1 month
        7776000, // 90 days - 3 months
        15552000, // 180 days - 6 months
        31104000 // 360 days - 12 months
    ];

    // Interest rates for each option (in percentage)
    uint256[4] interestRates = [5, 15, 40, 100];
    
    // Maximum amount for each option
    uint256 maxAmount = 1000000000000;

    // ERC20 contract address
    IERC20 public erc20Contract;

    // Events
    event tokensStaked(uint256 id, address from, uint256 amount);
    event TokensUnstaked(address to, uint256 amount);

    /// @dev Deploys contract and links the ERC20 token which we are staking
    /// @param _erc20_contract_address.
    constructor(IERC20 _erc20_contract_address) {
        // Set contract owner
        owner = msg.sender;
        // Set the erc20 contract address which this timelock is deliberately paired to
        require(address(_erc20_contract_address) != address(0), "_erc20_contract_address address can not be zero");
        erc20Contract = _erc20_contract_address;
        // Initialize the reentrancy variable to not locked
        locked = false;
    }

    // Modifier
    /**
     * @dev Prevents reentrancy
     */
    modifier noReentrant() {
        require(!locked, "No re-entrancy");
        locked = true;
        _;
        locked = false;
    }

    // Modifier
    /**
     * @dev Throws if called by any account other than the owner.
     */
    modifier onlyOwner() {
        require(msg.sender == owner, "Message sender must be the contract's owner.");
        _;
    }

    /// @dev Allows the contract owner to allocate official ERC20 tokens to each future recipient (only one at a time).
    /// @param _token, the official ERC20 token which this contract exclusively accepts.
    /// @param _amount to allocate to recipient.
    /// @param _option to take, e.g. 1 month, 3 months, 6 months, or 12 months
    function stakeTokens(IERC20 _token, uint256 _amount, uint8 _option) public noReentrant {
        require(_token == erc20Contract, "You are only allowed to stake the official erc20 token address which was passed into this contract's constructor");
        require(_amount <= _token.balanceOf(msg.sender), "Not enough STATE tokens in your wallet, please try lesser _amount");
        require(_amount <= maxAmount, "Cannot stake more than 1000 bil. tokens");
        require(_option < 4, "Invalid option");
        
        _token.safeTransferFrom(msg.sender, address(this), _amount);

        uint256 initTime = block.timestamp;
        uint256 interest = _amount.mul(interestRates[_option]).div(100);

        stakes[stakeIdCounter].author = msg.sender;
        stakes[stakeIdCounter].token = _token;
        stakes[stakeIdCounter].balance = _amount;
        stakes[stakeIdCounter].balanceToWithdraw = _amount.add(interest);
        stakes[stakeIdCounter].initTime = initTime;
        stakes[stakeIdCounter].withdrawTime = initTime.add(timePeriods[_option]);
        
        emit tokensStaked(stakeIdCounter, msg.sender, _amount);
        stakeIdCounter.add(1);
    }

    /// @dev Allows user to unstake tokens after the correct time period has elapsed
    /// @param _stakeId - the stake ID to unlock
    function unstakeTokens(uint256 _stakeId) public noReentrant {
        Stake memory stake = stakes[_stakeId];
        if (block.timestamp >= stake.withdrawTime) {
            stake.token.safeTransfer(msg.sender, stake.balanceToWithdraw);
            delete stakes[_stakeId];
            emit TokensUnstaked(msg.sender, stake.balanceToWithdraw);
        } else {
            revert("Tokens are only available after correct time period has elapsed");
        }
    }

    /// @dev Transfer accidentally locked ERC20 tokens.
    /// @param _token - ERC20 token address.
    /// @param _amount of ERC20 tokens to remove.
    function transferAccidentallyLockedTokens(IERC20 _token, uint256 _amount) public onlyOwner noReentrant {
        require(address(_token) != address(0), "Token address can not be zero");
        require(
            _token != erc20Contract, 
            "Token address can not be ERC20 address which was passed into the constructor"
        );
        _token.safeTransfer(owner, _amount);
    }
}