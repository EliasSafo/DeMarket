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
    uint public securityDepositAmount; // Renamed from securityDeposit to securityDepositAmount


    struct TransporterFees {
        uint fee;
    }

    mapping(address => TransporterFees) public transporters; // Mapping with transporter address as key
    address[] public transporterAddresses; // Array to store transporter addresses

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

    event ProductPurchased(address buyer, uint price);
    event TransporterCreated(address transporter, uint fee);
    event TransporterSecurityDeposit(address transporter, uint price);

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
        require(msg.sender != owner, "Cannot buy own product");

        buyer = payable(msg.sender);
        purchased = true;
        emit ProductPurchased(msg.sender, price);
    }

    function withdrawProductPrice() public onlyBuyer transporterSet {
        require(purchased, "Product not yet purchased");
        owner.transfer(price);
        owner = buyer;
    }

    function setTransporter(address payable _transporter) external payable onlySeller {
        require(msg.value == transporters[_transporter].fee, "Seller needs to deposit delivery fee");
        require(transporters[_transporter].fee != 0, "Transporter address not found in transporters");

        deliveryFee = msg.value;
        transporter = _transporter;
    }

    function createTransporter(uint _feeInEther) public {
        require(transporters[msg.sender].fee == 0, "Transporter already exists");

        // Convert fee from ether to wei
        uint _feeInWei = _feeInEther * 1 ether;

        transporters[msg.sender] = TransporterFees({
            fee: _feeInWei
        });
        transporterAddresses.push(msg.sender);
        transporterCount++;
        emit TransporterCreated(msg.sender, _feeInWei);
    }

    function securityDeposit() public payable onlyTransporter transporterSet {
        require(msg.value >= price, "Transporter needs to deposit an amount equal to the price");
        securityDepositAmount += msg.value; // Update the securityDepositAmount
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
