// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract ProductEscrow {
    uint public id;
    string public name;
    uint public price; // Price in wei
    address payable public owner;
    bool public purchased;
    address payable public buyer;
    uint public transporterCount;
    address payable public transporter;
    uint public deliveryFee;
    uint public securityDepositAmount;

    struct TransporterFees {
        uint fee;
    }

    mapping(address => TransporterFees) public transporters;
    address[] public transporterAddresses;

    modifier onlyBuyer() {
        require(msg.sender == buyer, "Only the buyer can call this function");
        _;
    }

    modifier onlySeller() {
        require(msg.sender == owner, "Only the seller can call this function");
        _;
    }

    modifier transporterSet() {
        require(transporter != address(0), "Transporter needed to call this function");
        _;
    }

    modifier onlyTransporter(){
        require(msg.sender == transporter, "Only the transporter can call this function");
        _;
    }

    event OrderConfirmed(address indexed buyer, uint indexed price, string vcCID);
    event TransporterCreated(address transporter, uint fee);
    event TransporterSecurityDeposit(address transporter, uint price);
    event DeliveryConfirmed(address indexed buyer, address indexed transporter, uint price);
    event CancelDelivery(address indexed seller, address indexed transporter, uint buyerRefund);

    constructor(string memory _name, uint _price, address _owner) {
        name = _name;
        price = _price;
        owner = payable(_owner);
        purchased = false;
        buyer = payable(address(0));
    }

    function confirmDelivery() public onlyBuyer transporterSet {
        owner.transfer(price);
        transporter.transfer(securityDepositAmount + deliveryFee);
        owner = buyer;
        emit DeliveryConfirmed(buyer, transporter, price);
    }

    function confirmOrder(string memory vcCID) public onlySeller {
        emit OrderConfirmed(buyer, price, vcCID);
    }

    function depositPurchase() public payable {
        require(!purchased, "Product already purchased");
        require(msg.value >= price, "Not enough Ether");
        require(msg.sender != owner, "Cannot buy own product");

        buyer = payable(msg.sender);
        purchased = true;
    }

    function withdrawProductPrice() public onlyBuyer transporterSet {
        require(purchased, "Product not yet purchased");
        owner.transfer(price);
        transporter.transfer(price + deliveryFee);
        owner = buyer;
    }

    function cancelDelivery() public onlySeller transporterSet {
        require(purchased, "Product not yet purchased");
        transporter.transfer((2 * price) / 10 + deliveryFee + price); // Equivalent to 0.2 * price + deliveryFee + price
        owner.transfer(price / 10); // Equivalent to 0.1 * price
        buyer.transfer((7 * price) / 10); // Equivalent to 0.7 * price
        emit CancelDelivery(msg.sender, transporter, (7 * price) / 10); // Emit the CancelDelivery event
    }

    function setTransporter(address payable _transporter) external payable onlySeller {
        require(msg.value == transporters[_transporter].fee, "Seller needs to deposit delivery fee");
        require(transporters[_transporter].fee != 0, "Transporter address not found in transporters");

        deliveryFee = msg.value;
        transporter = _transporter;
    }

    function createTransporter(uint _feeInEther) public {
        require(transporters[msg.sender].fee == 0, "Transporter already exists");

        uint _feeInWei = _feeInEther * 1 ether;

        transporters[msg.sender] = TransporterFees({ fee: _feeInWei });
        transporterAddresses.push(msg.sender);
        transporterCount++;
        emit TransporterCreated(msg.sender, _feeInWei);
    }

    function securityDeposit() public payable onlyTransporter transporterSet {
        require(msg.value >= price, "Transporter needs to deposit an amount equal to the price");
        securityDepositAmount += msg.value;
        emit TransporterSecurityDeposit(msg.sender, msg.value);
    }

    function getAllTransporters() public view returns (address[] memory, uint[] memory) {
        uint[] memory fees = new uint[](transporterAddresses.length);
        for (uint i = 0; i < transporterAddresses.length; i++) {
            address transporterAddress = transporterAddresses[i];
            fees[i] = transporters[transporterAddress].fee;
        }
        return (transporterAddresses, fees);
    }
}
