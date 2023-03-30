// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract CurveLikeAMM is ERC20("Curve LP Token", "CRLPT") {
    using SafeMath for uint256;

    IERC20 public token1;
    IERC20 public token2;
    uint256 public A; // Curve-like AMM parameter

    constructor(address _token1, address _token2, uint256 _A) {
        token1 = IERC20(_token1);
        token2 = IERC20(_token2);
        A = _A;
    }

    function addLiquidity(uint256 token1Amount, uint256 token2Amount) external payable {
        uint256 lpTokensToMint;

        if (totalSupply() == 0) {
            lpTokensToMint = token1Amount;
        } else {
            uint256 token1Reserve = token1.balanceOf(address(this));
            uint256 token2Reserve = token2.balanceOf(address(this));
            uint256 token1LpTokens = (token1Amount * totalSupply()) / token1Reserve;
            uint256 token2LpTokens = (token2Amount * totalSupply()) / token2Reserve;
            lpTokensToMint = token1LpTokens < token2LpTokens ? token1LpTokens : token2LpTokens;
        }

        require(lpTokensToMint > 0, "Insufficient liquidity");

        _mint(msg.sender, lpTokensToMint);
        token1.transferFrom(msg.sender, address(this), token1Amount);
        token2.transferFrom(msg.sender, address(this), token2Amount);
    }

    function removeLiquidity(uint256 lpTokens) external {
        uint256 token1Reserve = token1.balanceOf(address(this));
        uint256 token2Reserve = token2.balanceOf(address(this));

        uint256 token1Amount = (lpTokens * token1Reserve) / totalSupply();
        uint256 token2Amount = (lpTokens * token2Reserve) / totalSupply();

        _burn(msg.sender, lpTokens);
        token1.transfer(msg.sender, token1Amount);
        token2.transfer(msg.sender, token2Amount);
    }

    function swap(uint256 token1In, uint256 token2In) external payable {
        require(token1In > 0 || token2In > 0, "Invalid input amounts");

        uint256 token1Balance = token1.balanceOf(address(this));
        uint256 token2Balance = token2.balanceOf(address(this));

        if (token1In > 0) {
            token1.transferFrom(msg.sender, address(this), token1In);
            uint256 token2Out = calculateOut(token1In, token1Balance, token2Balance);
            token2.transfer(msg.sender, token2Out);
        } else {
            token2.transferFrom(msg.sender, address(this), token2In);
            uint256 token1Out = calculateOut(token2In, token2Balance, token1Balance);
            token1.transfer(msg.sender, token1Out);
        }
    }

    function calculateOut(uint256 tokenIn, uint256 tokenInBalance, uint256 tokenOutBalance) internal view returns (uint256) {
        uint256 invariant = (tokenInBalance * tokenOutBalance).mul(A.add(1)).div(A);
        uint256 newTokenInBalance = tokenInBalance.add(tokenIn);
        uint256 newTokenOutBalance = (invariant * A) / (newTokenInBalance * (A.add(1)));
        uint256 tokenOut = tokenOutBalance.sub(newTokenOutBalance);
        return tokenOut;
    }


    function getToken1ToToken2Rate() public view returns (uint256) {
        uint256 token1Reserve = token1.balanceOf(address(this));
        uint256 token2Reserve = token2.balanceOf(address(this));
        return token2Reserve * 1e18 / token1Reserve;
    }
}

