pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract CurveLikeAMM is ERC20("CurveAMM LP Token", "cLP") {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    IERC20 public tokenA;
    IERC20 public tokenB;
    uint256 public A = 100; // 模拟 Curve 池的A值。可以根据实际需求调整。

    constructor(IERC20 _tokenA, IERC20 _tokenB) {
        tokenA = _tokenA;
        tokenB = _tokenB;
    }

    function addLiquidity(uint256 amountA, uint256 amountB) external {
        require(amountA > 0 && amountB > 0, "Amounts must be greater than 0");

        uint256 totalSupply = totalSupply();
        uint256 tokenABalance = tokenA.balanceOf(address(this));
        uint256 tokenBBalance = tokenB.balanceOf(address(this));

        tokenA.safeTransferFrom(msg.sender, address(this), amountA);
        tokenB.safeTransferFrom(msg.sender, address(this), amountB);

        if (totalSupply == 0) {
            _mint(msg.sender, amountA.add(amountB));
        } else {
            uint256 lpAmount = (amountA.mul(totalSupply)).div(tokenABalance).add((amountB.mul(totalSupply)).div(tokenBBalance));
            _mint(msg.sender, lpAmount);
        }
    }

    function removeLiquidity(uint256 lpAmount) external {
        require(lpAmount > 0, "LP amount must be greater than 0");

        uint256 totalSupply = totalSupply();
        uint256 tokenABalance = tokenA.balanceOf(address(this));
        uint256 tokenBBalance = tokenB.balanceOf(address(this));

        _burn(msg.sender, lpAmount);

        uint256 amountA = (lpAmount.mul(tokenABalance)).div(totalSupply);
        uint256 amountB = (lpAmount.mul(tokenBBalance)).div(totalSupply);

        tokenA.safeTransfer(msg.sender, amountA);
        tokenB.safeTransfer(msg.sender, amountB);
    }

    function swap(uint256 amountA, uint256 minAmountB) external {
        require(amountA > 0, "Amount must be greater than 0");

        uint256 tokenABalance = tokenA.balanceOf(address(this));
        uint256 tokenBBalance = tokenB.balanceOf(address(this));

        uint256 invariant = calculateInvariant(tokenABalance, tokenBBalance);
        uint256 newTokenABalance = tokenABalance.add(amountA);
        uint256 newTokenBBalance = getExpectedTokenOutBalance(invariant, newTokenABalance);

        uint256 amountB = tokenBBalance.sub(newTokenBBalance);
        require(amountB >= minAmountB, "AmountB is less than the minimum required");
        tokenA.safeTransferFrom(msg.sender, address(this), amountA);
        tokenB.safeTransfer(msg.sender, amountB);
    }

    function calculateInvariant(uint256 tokenABalance, uint256 tokenBBalance) internal view returns (uint256) {
        uint256 product = tokenABalance.mul(tokenBBalance);
        uint256 invariant = product.mul(A).add(product);
        return invariant;
    }

    function getExpectedTokenOutBalance(uint256 invariant, uint256 newTokenABalance) internal view returns (uint256) {
        uint256 newTokenBBalance = (invariant.mul(newTokenABalance)).div(newTokenABalance.mul(A).add(newTokenABalance));
        return newTokenBBalance;
    }

    function getEstimatedTokenBForTokenA(uint256 amountA) external view returns (uint256) {
        uint256 tokenABalance = tokenA.balanceOf(address(this));
        uint256 tokenBBalance = tokenB.balanceOf(address(this));

        uint256 invariant = calculateInvariant(tokenABalance, tokenBBalance);
        uint256 newTokenABalance = tokenABalance.add(amountA);
        uint256 newTokenBBalance = getExpectedTokenOutBalance(invariant, newTokenABalance);

        uint256 amountB = tokenBBalance.sub(newTokenBBalance);
        return amountB;
    }
}
