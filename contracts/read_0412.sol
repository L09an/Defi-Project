// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface ICurveLikeAMM {
    function getToken1ToToken2Rate() external view returns (uint256);
    function getToken2ToToken1Rate() external view returns (uint256);
    function token1() external view returns (address);
    function token2() external view returns (address);
}

contract RateStorage {
    struct RateInfo {
        uint256 rate12;
        uint256 rate21;
        address token1;
        address token2;
    }
    address public owner;
    mapping(address => RateInfo) public rateInfos;
    address[] public ammAddresses;
    event searchrate(address indexed caller,address token1Address, address token2Address);
    constructor(){
        owner=msg.sender;
    }
    modifier onlyOwner(){
        require(msg.sender==owner||msg.sender==address(this),"only owner can call this function");
        _;
    }
    function fetchAndStoreRate(address curveLikeAMMAddress) public onlyOwner{
        ICurveLikeAMM curveLikeAMM = ICurveLikeAMM(curveLikeAMMAddress);
        uint256 rate12 = curveLikeAMM.getToken1ToToken2Rate();
        uint256 rate21 = curveLikeAMM.getToken2ToToken1Rate();
        address token1Address = curveLikeAMM.token1();
        address token2Address = curveLikeAMM.token2();

        rateInfos[curveLikeAMMAddress] = RateInfo(rate12, rate21,token1Address, token2Address);

        bool isAddressPresent = false;
        for (uint256 i = 0; i < ammAddresses.length; i++) {
            if (ammAddresses[i] == curveLikeAMMAddress) {
                isAddressPresent = true;
                break;
            }
        }

        if (!isAddressPresent) {
            ammAddresses.push(curveLikeAMMAddress);
        }
    }


    function getLowestRateAMM(address token1Address, address token2Address) public returns (address) {
        address lowestRateAMM = address(0);
        uint256 lowestRate = type(uint256).max;
        bool hasMatchingAddress = false;

        for (uint256 i = 0; i < ammAddresses.length; i++) {
            RateInfo memory rateInfo = rateInfos[ammAddresses[i]];
            if (rateInfo.token1 == token1Address && rateInfo.token2 == token2Address) {
                hasMatchingAddress = true;
                fetchAndStoreRate(ammAddresses[i]);
                rateInfo = rateInfos[ammAddresses[i]]; // Refresh rateInfo after fetchAndStoreRate
                if (rateInfo.rate12 < lowestRate) {
                    lowestRate = rateInfo.rate12;
                    lowestRateAMM = ammAddresses[i];
                }
            }
            else if (rateInfo.token1 == token2Address && rateInfo.token2 == token1Address) {
                hasMatchingAddress = true;
                fetchAndStoreRate(ammAddresses[i]);
                rateInfo = rateInfos[ammAddresses[i]]; // Refresh rateInfo after fetchAndStoreRate
                if (rateInfo.rate21 < lowestRate) {
                    lowestRate = rateInfo.rate21;
                    lowestRateAMM = ammAddresses[i];
                }
            }
        }
        
        require(hasMatchingAddress, "No matching AMM found");
        emit searchrate(msg.sender,token1Address,token2Address);
        return lowestRateAMM;
    }

}
