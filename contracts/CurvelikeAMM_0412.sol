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
    function modifyA(uint256 newA) external onlyOwner{
        A=newA;
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
    function predictIn(uint256 token1Out, uint256 token2Out) external view returns (uint256) {
        require(token1Out > 0 || token2Out > 0, "Invalid output amounts");
        
        uint256 token1Balance = token1.balanceOf(address(this));
        uint256 token2Balance = token2.balanceOf(address(this));
        
        if (token1Out > 0) {
            return calculateIn(token1Out, token2Balance, token1Balance);
        } else {
            return calculateIn(token2Out, token1Balance, token2Balance);
        }
    }

    function calculateIn(uint256 tokenOut, uint256 tokenInBalance, uint256 tokenOutBalance) internal view returns (uint256) {
        uint256 fee = 3; // 0.3%
        uint256 scaledTokenInBalance = tokenInBalance.div(1e8);
        uint256 scaledTokenOutBalance = tokenOutBalance.div(1e8);
        uint256 newScaledTokenOutBalance = scaledTokenOutBalance.sub(tokenOut.div(1e8));

        uint256 invariant = (scaledTokenInBalance * scaledTokenOutBalance).mul(A.add(1)).div(A);
        uint256 newScaledTokenInBalance = (invariant * A) / (newScaledTokenOutBalance * (A.add(1)));
        uint256 tokenIn = newScaledTokenInBalance.sub(scaledTokenInBalance).mul(1e8);
        
        uint256 tokenInWithFee = tokenIn.mul(1000).div(1000 - fee);

        return tokenInWithFee;
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
            token2FromFee=tokenWithoutFee(token1In, token1Balance, token2Balance)-token2Out;
            distributeFee_2(token2FromFee);
            emit Swap(msg.sender, token1In, 0, 0, token2Out);
        } else {
            token2.transferFrom(msg.sender, address(this), token2In);
            uint256 token1Out = calculateOut(token2In, token2Balance, token1Balance);
            token1.transfer(msg.sender, token1Out);
            require(token1Out<tokenWithoutFee(token2In, token2Balance, token1Balance),"error");
            token1FromFee=tokenWithoutFee(token2In, token2Balance, token1Balance)-token1Out;
            distributeFee_1(token1FromFee);
            emit Swap(msg.sender, 0, token2In, token1Out, 0);
        }
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

    function predictOut(uint256 token1In, uint256 token2In) external view returns (uint256){
        require(token1In > 0 || token2In > 0, "Invalid input amounts");
        // (token1_balance * token2_balance * (A + 1)) / A
        uint256 token1Balance = token1.balanceOf(address(this));
        uint256 token2Balance = token2.balanceOf(address(this));
        if (token1In > 0) {
            return calculateOut(token1In, token1Balance, token2Balance);

        } else {
            return calculateOut(token2In, token2Balance, token1Balance);
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

