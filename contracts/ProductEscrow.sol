// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract ProductEscrow {
    uint public id;
    string public name;
    uint public price; // Price in wei
    address payable public owner;
    bool public purchased;
    address payable public buyer;
    event ProductPurchased(address buyer, uint price);

    constructor(string memory _name, uint _price, address _owner) {
        name = _name;
        price = _price; // Price is expected to be in wei
        owner = payable(_owner);
        purchased = false;
        buyer = payable(address(0));
    }

    function depositPurchase() public payable {
        require(!purchased, "Product already purchased");
        require(msg.value >= price, "Not enough Ether");

        buyer = payable(msg.sender);
        purchased = true;
        emit ProductPurchased(msg.sender, price);
    }

    function withdrawProductPrice() public {
        require(purchased, "Product not yet purchased");
        owner.transfer(price);
    }
}