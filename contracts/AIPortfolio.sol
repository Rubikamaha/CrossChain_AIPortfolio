// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

/**
 * @title AIPortfolio
 * @dev Dynamic AI-driven Cross-chain Portfolio Manager with Uniswap V3 Rebalancing
 */
contract AIPortfolio is Ownable, ReentrancyGuard {
    struct TokenInfo {
        address tokenAddress;
        address priceFeed; // Chainlink Aggregator
        uint256 targetWeight; // In basis points (100 = 1%)
        bool isActive;
    }

    ISwapRouter public immutable swapRouter;
    uint256 public constant BPS_DENOMINATOR = 10000;
    uint256 public rebalanceThreshold = 200; // 2% deviation threshold

    address[] public tokenList;
    mapping(address => TokenInfo) public tokens;
    
    event Rebalanced(address tokenIn, address tokenOut, uint256 amountIn, uint256 amountOut);
    event TokenUpdated(address indexed token, uint256 targetWeight, bool isActive);
    event ThresholdUpdated(uint256 newThreshold);

    constructor(address _swapRouter, address _initialOwner) Ownable(_initialOwner) {
        swapRouter = ISwapRouter(_swapRouter);
    }

    /**
     * @dev Add or update a token in the portfolio
     */
    function setToken(
        address _token,
        address _priceFeed,
        uint256 _targetWeight,
        bool _isActive
    ) external onlyOwner {
        if (!tokens[_token].isActive && _isActive) {
            tokenList.push(_token);
        }
        
        tokens[_token] = TokenInfo({
            tokenAddress: _token,
            priceFeed: _priceFeed,
            targetWeight: _targetWeight,
            isActive: _isActive
        });

        emit TokenUpdated(_token, _targetWeight, _isActive);
        _validateWeights();
    }

    /**
     * @dev Set rebalancing threshold (in BPS)
     */
    function setThreshold(uint256 _threshold) external onlyOwner {
        rebalanceThreshold = _threshold;
        emit ThresholdUpdated(_threshold);
    }

    /**
     * @dev Calculate total portfolio value in USD (8 decimals from Chainlink)
     */
    function getTotalValue() public view returns (uint256 totalValue) {
        for (uint256 i = 0; i < tokenList.length; i++) {
            address tokenAddr = tokenList[i];
            if (tokens[tokenAddr].isActive) {
                totalValue += getTokenValue(tokenAddr);
            }
        }
    }

    /**
     * @dev Get USD value of a specific token held by the contract
     */
    function getTokenValue(address _token) public view returns (uint256) {
        uint256 balance = IERC20(_token).balanceOf(address(this));
        if (balance == 0) return 0;
        
        (, int256 price, , , ) = AggregatorV3Interface(tokens[_token].priceFeed).latestRoundData();
        require(price > 0, "Invalid price");
        
        // Adjust for decimals: assume balance is 18 decimals, price is 8 decimals
        return (balance * uint256(price)) / 1e18;
    }

    /**
     * @dev Rebalance the portfolio by swapping over-allocated tokens for under-allocated ones
     * This is a simplified version; production AI might call this with specific pathing
     */
    function rebalance(address _tokenOut, address _tokenIn, uint24 _fee) external nonReentrant {
        uint256 totalValue = getTotalValue();
        require(totalValue > 0, "Empty portfolio");

        uint256 currentValOut = getTokenValue(_tokenOut);
        uint256 targetValOut = (totalValue * tokens[_tokenOut].targetWeight) / BPS_DENOMINATOR;

        // Check if _tokenOut is over-allocated beyond threshold
        if (currentValOut > targetValOut) {
            uint256 deviation = ((currentValOut - targetValOut) * BPS_DENOMINATOR) / totalValue;
            if (deviation >= rebalanceThreshold) {
                uint256 amountToSwap = _calculateSwapAmount(_tokenOut, currentValOut - targetValOut);
                _executeSwap(_tokenOut, _tokenIn, amountToSwap, _fee);
            }
        }
    }

    function _calculateSwapAmount(address _token, uint256 _usdValueToSwap) internal view returns (uint256) {
        (, int256 price, , , ) = AggregatorV3Interface(tokens[_token].priceFeed).latestRoundData();
        return (_usdValueToSwap * 1e18) / uint256(price);
    }

    function _executeSwap(
        address _tokenIn,
        address _tokenOut,
        uint256 _amountIn,
        uint24 _fee
    ) internal {
        IERC20(_tokenIn).approve(address(swapRouter), _amountIn);

        ISwapRouter.ExactInputSingleParams memory params = ISwapRouter.ExactInputSingleParams({
            tokenIn: _tokenIn,
            tokenOut: _tokenOut,
            fee: _fee,
            recipient: address(this),
            deadline: block.timestamp,
            amountIn: _amountIn,
            amountOutMinimum: 0, // In production, add slippage protection
            sqrtPriceLimitX96: 0
        });

        uint256 amountOut = swapRouter.exactInputSingle(params);
        emit Rebalanced(_tokenIn, _tokenOut, _amountIn, amountOut);
    }

    function _validateWeights() internal view {
        uint256 totalWeight = 0;
        for (uint256 i = 0; i < tokenList.length; i++) {
            if (tokens[tokenList[i]].isActive) {
                totalWeight += tokens[tokenList[i]].targetWeight;
            }
        }
        require(totalWeight <= BPS_DENOMINATOR, "Weight exceeds 100%");
    }
}
