// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";

contract CurveLikeAMM is ERC20("Curve LP Token", "CRLPT") {
    using SafeMath for uint256;
    using Math for uint256;
    IERC20 public token1;
    IERC20 public token2;
    uint256 public A; // Curve-like AMM parameter
    uint256 public token1FromFee;
    uint256 public token2FromFee;  
    uint256 public D;
    mapping(address => uint256) public stake;  
    address[] public stackAddresses;
    event AddLiquidity   (address indexed provider, uint256 token1Amount, uint256 token2Amount, uint256 lpTokens);
    event RemoveLiquidity(address indexed provider, uint256 lpTokens, uint256 token1Amount, uint256 token2Amount);
    event Swap           (address indexed user, uint256 token1In, uint256 token2In, uint256 token1Out, uint256 token2Out);
    event DistributeFee1 (address indexed holder, uint256 token1Amount);
    event DistributeFee2 (address indexed holder, uint256 token2Amount);
    address owner;
    constructor(address _token1, address _token2) {
        token1 = IERC20(_token1);
        token2 = IERC20(_token2);
        A = 100;
        token1FromFee=0;
        token2FromFee=0;
        owner=msg.sender;
    }
    modifier onlyOwner(){
        require(msg.sender==owner,"only owner can call this function");
        _;
    }

     function getD(uint256 _x1, uint256 _x2) public view returns (uint256) {
        return (A.mul(4).mul(_x1).mul(_x2)).div(A.mul(4).add((_x1.add(_x2)).sqrt()));
    }
    function addLiquidity(uint256 token1Amount, uint256 token2Amount) external payable {
        uint256 lpTokensToMint;

        if (totalSupply() == 0) {
            lpTokensToMint = (token1Amount * token2Amount).sqrt();
        } else {
            uint256 token1Reserve = token1.balanceOf(address(this));
            uint256 token2Reserve = token2.balanceOf(address(this));
            lpTokensToMint = totalSupply() * ((token1Amount * token2Amount).sqrt() / (token1Reserve * token2Reserve).sqrt());
        }

        require(lpTokensToMint > 0, "Insufficient liquidity");

        _mint(msg.sender, lpTokensToMint);//遵循先mint再更改原则
        stake[msg.sender]+=lpTokensToMint;
        if(checkadress(msg.sender)==false){//不在列表中就加进来
            stackAddresses.push(msg.sender);
        }
        token1.transferFrom(msg.sender, address(this), token1Amount);
        token2.transferFrom(msg.sender, address(this), token2Amount);
        emit AddLiquidity(msg.sender, token1Amount, token2Amount, lpTokensToMint);
    }

    function checkadress(address outside_adrress) internal view returns (bool){//检查地址是否在列表中
        bool isAddressPresent = false;
        for (uint256 i = 0; i < stackAddresses.length; i++) {
            if (stackAddresses[i] == outside_adrress) {
                isAddressPresent = true;
                break;
            }
        }
        return isAddressPresent;
    }

    function removeLiquidity(uint256 lpTokens) external {
        uint256 token1Reserve = token1.balanceOf(address(this));
        uint256 token2Reserve = token2.balanceOf(address(this));
        require(balanceOf(msg.sender)>=lpTokens,"not enough lp tokens");
        uint256 token1Amount = (lpTokens * token1Reserve) / totalSupply();
        uint256 token2Amount = (lpTokens * token2Reserve) / totalSupply();

        _burn(msg.sender, lpTokens);
        stake[msg.sender]-=lpTokens;
        token1.transfer(msg.sender, token1Amount);
        token2.transfer(msg.sender, token2Amount);
        emit RemoveLiquidity(msg.sender, lpTokens, token1Amount, token2Amount);
    }

    function swap(uint256 token1In, uint256 token2In) external payable {
        require(token1In > 0 || token2In > 0, "Invalid input amounts");
        // (token1_balance * token2_balance * (A + 1)) / A
        uint256 token1Balance = token1.balanceOf(address(this));
        uint256 token2Balance = token2.balanceOf(address(this));
        D = getD(token1Balance, token2Balance);
        if (token1In > 0) {
            token1.transferFrom(msg.sender, address(this), token1In);
            uint256 token2Out = calculateOut(token1In, token1Balance, token2Balance);
            token2.transfer(msg.sender, token2Out);
            require(token2Out<tokenWithoutFee(token1In, token1Balance, token2Balance),"error");
            // token2FromFee=tokenWithoutFee(token1In, token1Balance, token2Balance)-token2Out;
            // distributeFee_2(token2FromFee);
            emit Swap(msg.sender, token1In, 0, 0, token2Out);
        } else {
            token2.transferFrom(msg.sender, address(this), token2In);
            uint256 token1Out = calculateOut(token2In, token2Balance, token1Balance);
            token1.transfer(msg.sender, token1Out);
            require(token1Out<tokenWithoutFee(token2In, token2Balance, token1Balance),"error");
            // token1FromFee=tokenWithoutFee(token2In, token2Balance, token1Balance)-token1Out;
            // distributeFee_1(token1FromFee);
            emit Swap(msg.sender, 0, token2In, token1Out, 0);
        }
    }
    function predictIn(uint256 token1Out, uint256 token2Out) external returns (uint256) {
        require(token1Out > 0 || token2Out > 0, "Invalid output amounts");
        uint256 token1Balance = token1.balanceOf(address(this));
        uint256 token2Balance = token2.balanceOf(address(this));
        if (token1Out > 0) {
            return calculateIn(token1Out, token1Balance, token2Balance);
        } else {
            return calculateIn(token2Out, token2Balance, token1Balance);
        }
    }

    function calculateIn(uint256 tokenOut, uint256 tokenOutBalance, uint256 tokenInBalance) public returns (uint256) {
        D = getD(tokenInBalance, tokenOutBalance);
        uint256 y1 = tokenOutBalance.sub(tokenOut);
        uint256 y2 = (D.mul(D)).div(A.mul(4).mul(y1)).add(y1).sub(D).div(2);
        uint256 inputAmount = y2.sub(tokenInBalance);
        uint256 fee = inputAmount.mul(3).div(1000);
        return inputAmount.add(fee);
    }

    function distributeFee_1(uint256 fee) internal {
        uint256 totalStake = totalSupply();
        for (uint256 i = 0; i < stackAddresses.length; i++) {
            address holder = stackAddresses[i];
            uint256 holderStake = stake[holder];
            uint256 holderShare = (holderStake * fee) / totalStake;//取四位有效数字就行

            if (holderShare > 0) {
                token1.transfer(holder, holderShare);
                emit DistributeFee1(holder, holderShare);
            }
        }
    }
       function distributeFee_2(uint256 fee) internal {
        uint256 totalStake = totalSupply();
        for (uint256 i = 0; i < stackAddresses.length; i++) {
            address holder = stackAddresses[i];
            uint256 holderStake = stake[holder];
            uint256 holderShare = (holderStake * fee) / totalStake;//取四位有效数字就行

            if (holderShare > 0) {
                token2.transfer(holder, holderShare);
                emit DistributeFee2(holder, holderShare);
            }
        }
    }

    function predictOut(uint256 token1In, uint256 token2In) external returns (uint256){
        require(token1In > 0 || token2In > 0, "Invalid input amounts");
        uint256 token1Balance = token1.balanceOf(address(this));
        uint256 token2Balance = token2.balanceOf(address(this));
        if (token1In > 0) {
            return calculateOut(token1In, token1Balance, token2Balance);

        } else {
            return calculateOut(token2In, token2Balance, token1Balance);
        }
    }

    function calculateOut(uint256 tokenIn, uint256 tokenInBalance, uint256 tokenOutBalance) internal returns (uint256) {
        D=getD(tokenInBalance,tokenOutBalance);
        uint256 y1 = tokenInBalance.add(tokenIn);
        uint256 y2 = (D.mul(D)).div(A.mul(4).mul(y1)).add(y1).sub(D).div(2);
        uint256 outputAmount = tokenOutBalance.sub(y2);
        uint256 fee=outputAmount.mul(3).div(1000);
        return outputAmount.sub(fee);
    }
 

    function tokenWithoutFee(uint256 tokenIn, uint256 tokenInBalance, uint256 tokenOutBalance) internal returns (uint256){
        D=getD(tokenInBalance,tokenOutBalance);
        uint256 y1 = tokenInBalance.add(tokenIn);
        uint256 y2 = ( D.mul(D)).div(A.mul(4).mul(y1)).add(y1).sub(D).div(2);
        uint256 outputAmount = tokenOutBalance.sub(y2);
        return outputAmount;
    }

    function getToken1ToToken2Rate() public view returns (uint256) {
        uint256 token1Reserve = token1.balanceOf(address(this));
        uint256 token2Reserve = token2.balanceOf(address(this));
        if(token1Reserve==0){
            return type(uint256).max;
        }
        else{
            return token1Reserve * 1e18 / token2Reserve;
        }
    }
    function getToken2ToToken1Rate() public view returns (uint256) {
        uint256 token1Reserve = token1.balanceOf(address(this));
        uint256 token2Reserve = token2.balanceOf(address(this));
        if(token2Reserve==0){
            return type(uint256).max;
        }
        else{
            return token2Reserve * 1e18 / token1Reserve;
        }
    }

    function gettoken1Reserve() public view returns (uint256) {
        return token1.balanceOf(address(this));
    }

    function gettoken2Reserve() public view returns (uint256) {
        return token2.balanceOf(address(this));
    }
}

