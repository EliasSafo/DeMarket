import React, { useState, useEffect } from 'react';
import Web3 from 'web3';
import ProductFactoryABI from './abis/ProductFactory.json';
import ProductABI from './abis/ProductEscrow.json';
import './App.css';
import BasicTabs from './components/Tabs/Tab';
import AddProductForm from './components/AddProductForm/AddProductForm';
import ProductList from './components/ProductList/ProductList';
import TransporterForm from './components/TransporterForm/TransporterForm';
import Button from '@mui/material/Button';

const App = () => {
  const [web3, setWeb3] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [factoryContract, setFactoryContract] = useState(null);
  const [productName, setProductName] = useState('');
  const [productPrice, setProductPrice] = useState('');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tabIndex, setTabIndex] = useState(0); // State to handle the selected tab

  const factoryAddress = '0x9F44F8DbD040D5be8aD6e172a5f2a7681e454FC4'; // Replace with your factory contract address

  const fetchProducts = async (factoryContract, web3Instance) => {
    try {
      const productAddresses = await factoryContract.methods.getProducts().call();
      const productsArray = [];
      for (let address of productAddresses) {
        const productContract = new web3Instance.eth.Contract(ProductABI.abi, address);
        const name = await productContract.methods.name().call();
        const price = await productContract.methods.price().call();
        const owner = await productContract.methods.owner().call();
        const purchased = await productContract.methods.purchased().call();
        productsArray.push({
          address,
          name,
          price,
          owner,
          purchased,
        });
      }
      setProducts(productsArray);
      console.log('Products:', productsArray);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching products:', error);
      setError('Failed to fetch products. Check console for details.');
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        console.log('Attempting to connect to MetaMask...');
        if (window.ethereum) {
          const web3Instance = new Web3(window.ethereum);
          try {
            await window.ethereum.request({ method: 'eth_requestAccounts' });
          } catch (error) {
            console.error('User denied account access');
            return;
          }
          setWeb3(web3Instance);

          const accounts = await web3Instance.eth.getAccounts();
          if (!accounts || accounts.length === 0) {
            throw new Error('No accounts found. Ensure MetaMask is connected.');
          }
          setAccounts(accounts);
          console.log('Accounts:', accounts);

          const contractInstance = new web3Instance.eth.Contract(ProductFactoryABI.abi, factoryAddress);
          setFactoryContract(contractInstance);
          console.log('Factory contract instance:', contractInstance);

          await fetchProducts(contractInstance, web3Instance);

          window.ethereum.on('accountsChanged', async (newAccounts) => {
            if (newAccounts.length === 0) {
              console.error('MetaMask is locked or the user has not connected any accounts');
              setError('MetaMask is locked or the user has not connected any accounts');
              setAccounts([]);
            } else {
              console.log('Accounts changed:', newAccounts);
              setAccounts(newAccounts);
              await fetchProducts(contractInstance, web3Instance);
            }
          });
        } else {
          console.error('MetaMask is not installed');
          setError('MetaMask is not installed');
        }
      } catch (error) {
        console.error('Error initializing web3, accounts, or contract:', error);
        setError('Failed to load web3, accounts, or contract. Check console for details.');
        setLoading(false);
      }
    };
    init();
  }, []);

  const handleAddProduct = async () => {
    if (!web3 || !accounts || !factoryContract) {
      setError('Web3, accounts, or contract not loaded properly.');
      return;
    }

    if (!productName || !productPrice) {
      setError('All fields are required');
      return;
    }

    try {
      const priceInWei = web3.utils.toWei(productPrice, 'ether');
      console.log(`Adding product with name: ${productName}, price: ${priceInWei}`);

      const gasPrice = web3.utils.toWei('2', 'gwei');
      const gasLimit = 2000000; // Adjust if necessary

      console.log('Gas Price:', gasPrice);
      console.log('Gas Limit:', gasLimit);

      const tx = await factoryContract.methods.createProduct(productName, priceInWei).send({
        from: accounts[0],
        gasPrice: gasPrice,
        gas: gasLimit,
      });

      console.log('Transaction:', tx);

      await fetchProducts(factoryContract, web3);
    } catch (error) {
      console.error('Error adding product:', error);
      console.error('Error details:', error.response ? error.response : error.message);
      setError('Failed to add product. Check console for details.');
    }
  };

  const handlePurchaseProduct = async (address, price) => {
    if (!web3 || !accounts || !factoryContract) {
      setError('Web3, accounts, or contract not loaded properly.');
      return;
    }

    try {
      console.log(`Purchasing product at address: ${address} with price: ${price}`);
      const priceInWei = BigInt(price);
      const gasPrice = BigInt(web3.utils.toWei('2', 'gwei'));
      const gasLimit = BigInt(900000); // Adjust if necessary

      const productContract = new web3.eth.Contract(ProductABI.abi, address);

      const balance = BigInt(await web3.eth.getBalance(accounts[0]));
      console.log('Buyer account balance (in Wei):', balance);

      const transactionCost = priceInWei + (gasLimit * gasPrice);
      console.log('Transaction cost (in Wei):', transactionCost.toString());

      if (balance < transactionCost) {
        setError('Insufficient funds for transaction');
        console.error('Insufficient funds for transaction');
        return;
      }

      const tx = await productContract.methods.depositPurchase().send({
        from: accounts[0],
        value: priceInWei.toString(),
        gasPrice: gasPrice.toString(),
        gas: gasLimit.toString(),
      });

      console.log('Transaction:', tx);

      await fetchProducts(factoryContract, web3);
    } catch (error) {
      console.error('Error purchasing product:', error);
      setError('Failed to purchase product. Check console for details.');
    }
  };

  const handleDelivery = async (address) => {
    if (!address || typeof address !== 'string') {
      setError('Product contract address is not specified or is invalid');
      console.error('Product contract address is not specified or is invalid');
      return;
    }

    try {
      console.log(`Withdrawing funds for product at address: ${address}`);
      const gasPrice = BigInt(web3.utils.toWei('2', 'gwei'));
      const gasLimit = BigInt(900000); // Adjust if necessary
      const productContract = new web3.eth.Contract(ProductABI.abi, address);

      const tx = await productContract.methods.withdrawProductPrice().send({
        from: accounts[0],
        gasPrice: gasPrice.toString(),
        gas: gasLimit.toString(),
      });

      console.log('Transaction:', tx);
      await fetchProducts(factoryContract, web3);
    } catch (error) {
      console.error('Error withdrawing fund to seller:', error);
      setError('Failed to withdraw funds to seller. Check console for details.');
    }
  };

  const handleCreateTransporter = async (address, fee) => {
    if (!web3 || !accounts) {
      setError('Web3, accounts not loaded properly.');
      return;
    }

    try {
      console.log(`Creating transporter with fee: ${fee} ETH for product at address: ${address}`);
      const feeInWei = web3.utils.toWei(fee.toString(), 'ether');
      const gasPrice = BigInt(web3.utils.toWei('2', 'gwei'));
      const gasLimit = BigInt(900000); // Adjust if necessary

      const productContract = new web3.eth.Contract(ProductABI.abi, address);
      const priceInWei = await productContract.methods.price().call();
      console.log('Product price in Wei:', priceInWei);

      const tx = await productContract.methods.createTransporter(feeInWei).send({
        from: accounts[0],
        value: priceInWei.toString(), // Transporter deposits the product price as security deposit
        gasPrice: gasPrice.toString(),
        gas: gasLimit.toString(),
      });

      console.log('Transaction:', tx);
      await fetchProducts(factoryContract, web3);
    } catch (error) {
      console.error('Error creating transporter:', error);
      console.error('Error details:', error.response ? error.response : error.message);
      setError('Failed to create transporter. Check console for details.');
    }
  };

  const handleChangeTab = (event, newValue) => {
    setTabIndex(newValue);
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
      <div className="container">
        {error && <div style={{ color: 'red' }}>{error}</div>}
        <h1>Decentralized Marketplace</h1>
        <BasicTabs value={tabIndex} handleChange={handleChangeTab}>
          <div>
            <AddProductForm
                productName={productName}
                setProductName={setProductName}
                productPrice={productPrice}
                setProductPrice={setProductPrice}
                handleAddProduct={handleAddProduct}
            />
            <ProductList
                products={products.filter(product => product.owner === accounts[0])}
                web3={web3}
                handlePurchaseProduct={handlePurchaseProduct}
                handleDelivery={handleDelivery} // Pass handleDelivery to ProductList
                showPurchaseButton={false} // No purchase button in SELLER tab
            />
          </div>
          <div>
            <ProductList
                products={products.filter(product => product.owner !== accounts[0])}
                web3={web3}
                handlePurchaseProduct={handlePurchaseProduct}
                showPurchaseButton={true} // Show purchase button in BUYER tab
            />
          </div>
          <div>
            <TransporterForm
                products={products}
                handleCreateTransporter={handleCreateTransporter}
            />
          </div>
        </BasicTabs>
      </div>
  );
};

export default App;
