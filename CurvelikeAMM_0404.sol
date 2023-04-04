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
    uint256 public token1FromFee;
    uint256 public token2FromFee;
    constructor(address _token1, address _token2, uint256 _A) {
        token1 = IERC20(_token1);
        token2 = IERC20(_token2);
        A = _A;
        token1FromFee=0;
        token2FromFee=0;
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
        // (token1_balance * token2_balance * (A + 1)) / A
        uint256 token1Balance = token1.balanceOf(address(this));
        uint256 token2Balance = token2.balanceOf(address(this));

        if (token1In > 0) {
            token1.transferFrom(msg.sender, address(this), token1In);
            uint256 token2Out = calculateOut(token1In, token1Balance, token2Balance);
            token2.transfer(msg.sender, token2Out);
            require(token2Out<tokenWithoutFee(token1In, token1Balance, token2Balance),"error");
            token2FromFee+=tokenWithoutFee(token1In, token1Balance, token2Balance)-token2Out;
        } else {
            token2.transferFrom(msg.sender, address(this), token2In);
            uint256 token1Out = calculateOut(token2In, token2Balance, token1Balance);
            token1.transfer(msg.sender, token1Out);
            require(token1Out<tokenWithoutFee(token2In, token2Balance, token1Balance),"error");
            token1FromFee+=tokenWithoutFee(token2In, token2Balance, token1Balance)-token1Out;
        }
    }



    function calculateOut(uint256 tokenIn, uint256 tokenInBalance, uint256 tokenOutBalance) internal view returns (uint256) {
        uint256 fee = 3; // 0.3%
        uint256 tokenInWithFee = tokenIn * (1000 - fee);
        uint256 scaledTokenInBalance = tokenInBalance.div(1e8);
        uint256 scaledTokenOutBalance = tokenOutBalance.div(1e8);
        // 防止上溢风险
        uint256 invariant = (scaledTokenInBalance * scaledTokenOutBalance).mul(A.add(1)).div(A);
        uint256 newTokenInBalance = scaledTokenInBalance.add(tokenInWithFee.div(1e11));
        //fee多除了1000
        uint256 newTokenOutBalance = (invariant * A) / (newTokenInBalance * (A.add(1)));
        uint256 tokenOut = scaledTokenOutBalance.sub(newTokenOutBalance).mul(1e8);

  
        return tokenOut;
    }

    function tokenWithoutFee(uint256 tokenIn, uint256 tokenInBalance, uint256 tokenOutBalance) internal view returns (uint256){
        uint256 scaledTokenInBalance0 = tokenInBalance.div(1e8);
        uint256 scaledTokenOutBalance0 = tokenOutBalance.div(1e8);
        uint256 invariant0 = (scaledTokenInBalance0 * scaledTokenOutBalance0).mul(A.add(1)).div(A);
        uint256 newTokenInBalance0 = scaledTokenInBalance0.add(tokenIn.div(1e8));
        uint256 newTokenOutBalance0 = (invariant0 * A) / (newTokenInBalance0 * (A.add(1)));
        uint256 tokenOut0 = scaledTokenOutBalance0.sub(newTokenOutBalance0).mul(1e8);
        return tokenOut0;
    }
    //     uint256 invariant = (scaledTokenInBalance * scaledTokenOutBalance).mul(A.add(1)).div(A);
    //     uint256 newTokenInBalance = scaledTokenInBalance.add(tokenIn.div(1e18));
    //     uint256 newTokenOutBalance = (invariant * A) / (newTokenInBalance * (A.add(1)));
    //     uint256 tokenOut = scaledTokenOutBalance.sub(newTokenOutBalance).mul(1e18);

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

