// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";
contract ConstantProductAMM is ERC20("AMM LP Token", "AMMLPT") {
    using SafeMath for uint256;
    using Math for uint256;
    IERC20 public token1;
    IERC20 public token2;

    constructor(address _token1, address _token2) {
        token1 = IERC20(_token1);
        token2 = IERC20(_token2);
    }

        function addLiquidity(uint256 token1Amount, uint256 token2Amount) external payable {
        uint256 lpTokensToMint;

        if (totalSupply() == 0) {
            lpTokensToMint = (token1Amount * token2Amount).sqrt();
        } else {
            uint256 token1Reserve = token1.balanceOf(address(this));
            uint256 token2Reserve = token2.balanceOf(address(this));
            // uint256 token1LpTokens = (token1Amount * totalSupply()) / token1Reserve;
            // uint256 token2LpTokens = (token2Amount * totalSupply()) / token2Reserve;
            // lpTokensToMint = token1LpTokens < token2LpTokens ? token1LpTokens : token2LpTokens;
            lpTokensToMint = totalSupply() * ((token1Amount * token2Amount).sqrt() / (token1Reserve * token2Reserve).sqrt());
        }

        require(lpTokensToMint > 0, "Insufficient liquidity");

        _mint(msg.sender, lpTokensToMint);//遵循先mint再更改原则

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
    
    function calculateOut(uint256 tokenIn, uint256 tokenInBalance, uint256 tokenOutBalance) internal pure returns (uint256) {
        uint256 k = tokenInBalance * tokenOutBalance;
        uint256 newTokenInBalance = tokenInBalance + tokenIn;
        uint256 tokenOut = tokenOutBalance - (k / newTokenInBalance);
        return tokenOut;
    }
    
    function getToken1ToToken2Rate() public view returns (uint256) {
        uint256 token1Reserve = token1.balanceOf(address(this));
        uint256 token2Reserve = token2.balanceOf(address(this));
        return token2Reserve * 1e18 / token1Reserve;
    }

    function gettoken1Reserve() public view returns (uint256) {
        return token1.balanceOf(address(this));
    }

    function gettoken2Reserve() public view returns (uint256) {
        return token2.balanceOf(address(this));
    }
}