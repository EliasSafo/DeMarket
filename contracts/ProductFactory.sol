// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./ProductEscrow.sol";

contract ProductFactory {
    ProductEscrow[] public products;

    event ProductCreated(address productAddress, string name, uint price, address owner);

    function createProduct(string memory _name, uint _price) public {
        require(bytes(_name).length > 0, "Product name cannot be empty");
        require(_price > 0, "Product price must be greater than zero");

        ProductEscrow newProduct = new ProductEscrow(_name, _price, msg.sender);
        products.push(newProduct);
        emit ProductCreated(address(newProduct), _name, _price, msg.sender);
    }

    function getProducts() public view returns (ProductEscrow[] memory) {
        return products;
    }
}
