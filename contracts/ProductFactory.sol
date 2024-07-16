// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./ProductEscrow.sol";

contract ProductFactory {
    address[] public products;

    function createProduct(string memory _name, uint _price) public {
        ProductEscrow newProduct = new ProductEscrow(_name, _price, msg.sender);
        products.push(address(newProduct));
    }

    function getProducts() public view returns (address[] memory) {
        return products;
    }
}