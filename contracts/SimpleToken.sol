// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract MyToken {
    string public name = "RubikaToken";
    string public symbol = "RBT";
    uint8 public decimals = 18;
    uint public totalSupply;
    address public owner;

    mapping(address => uint) public balanceOf;
    mapping(address => mapping(address => uint)) public allowance;

    event Transfer(address indexed from, address indexed to, uint value);
    event Approval(address indexed owner, address indexed spender, uint value);


    // Exchange rate: 1 ETH = 1000 RBT
    uint public constant RATE = 1000;

    event TokensPurchased(address indexed buyer, uint amountETH, uint amountToken);
    event TokensSold(address indexed seller, uint amountToken, uint amountETH);

    constructor(uint supply) {
        owner = msg.sender;
        totalSupply = supply * 1e18;
        balanceOf[owner] = totalSupply;
        emit Transfer(address(0), owner, totalSupply);
    }

    function transfer(address to, uint value) external returns (bool) {
        require(balanceOf[msg.sender] >= value, "Insufficient balance");
        unchecked {
            balanceOf[msg.sender] -= value;
            balanceOf[to] += value;
        }
        emit Transfer(msg.sender, to, value);
        return true;
    }

    function approve(address spender, uint value) external returns (bool) {
        allowance[msg.sender][spender] = value;
        emit Approval(msg.sender, spender, value);
        return true;
    }

    function transferFrom(address from, address to, uint value) external returns (bool) {
        require(balanceOf[from] >= value, "Insufficient balance");
        require(allowance[from][msg.sender] >= value, "Insufficient allowance");
        unchecked {
            balanceOf[from] -= value;
            balanceOf[to] += value;
            allowance[from][msg.sender] -= value;
        }
        emit Transfer(from, to, value);
        return true;
    }

    // Buy tokens by sending ETH
    function buy() external payable {
        require(msg.value > 0, "Send ETH to buy");
        
        uint tokensToBuy = msg.value * RATE;
        // Mint new tokens to the buyer
        totalSupply += tokensToBuy;
        balanceOf[msg.sender] += tokensToBuy;
        
        emit Transfer(address(0), msg.sender, tokensToBuy);
        emit TokensPurchased(msg.sender, msg.value, tokensToBuy);
    }

    // Sell tokens for ETH
    function sell(uint amount) external {
        require(amount > 0, "Amount must be greater than 0");
        require(balanceOf[msg.sender] >= amount, "Insufficient token balance");

        uint ethToReturn = amount / RATE;
        require(address(this).balance >= ethToReturn, "Contract has insufficient ETH");

        // Burn tokens from seller
        balanceOf[msg.sender] -= amount;
        totalSupply -= amount;
        emit Transfer(msg.sender, address(0), amount);

        // Send ETH back to user
        (bool sent, ) = payable(msg.sender).call{value: ethToReturn}("");
        require(sent, "Failed to send ETH");

        emit TokensSold(msg.sender, amount, ethToReturn);
    }
}
