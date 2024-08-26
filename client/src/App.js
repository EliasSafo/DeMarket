import React, { useState, useEffect } from 'react';
import Web3 from 'web3';
import ProductFactoryABI from './abis/ProductFactory.json';
import ProductABI from './abis/ProductEscrow.json';
import './App.css';
import BasicTabs from './components/Tabs/Tab';
import SellerView from './components/SellerView/SellerView';
import BuyerView from './components/BuyerView/BuyerView';
import DistributorView from './components/DistributorView/DistributorView';

const App = () => {
  const [web3, setWeb3] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [factoryContract, setFactoryContract] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tabIndex, setTabIndex] = useState(0); // State to handle the selected tab

  const factoryAddress = '0xa4FC5a9e965B917D876Bd9DC637C9c8F351EF9cd'; // Replace with your factory contract address

  const fetchProducts = async (factoryContract, web3Instance) => {
    try {
      const productAddresses = await factoryContract.methods.getProducts().call();
      console.log('Product Addresses:', productAddresses); // Log product addresses
      const productsArray = [];
      for (let address of productAddresses) {
        const productContract = new web3Instance.eth.Contract(ProductABI.abi, address);
        const name = await productContract.methods.name().call();
        const price = await productContract.methods.price().call();
        const owner = await productContract.methods.owner().call();
        const purchased = await productContract.methods.purchased().call();
        const buyer = await productContract.methods.buyer().call(); // Fetch buyer
        const transporter = await productContract.methods.transporter().call(); // Fetch transporter


        productsArray.push({
          address,
          name,
          price,
          owner,
          purchased,
          buyer, // Add buyer to the product object
          transporter, // Add transporter to the product object
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

  const handleAddProduct = async (productName, productPrice) => {
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
      });

      console.log('Transaction:', tx);

      await fetchProducts(factoryContract, web3);
    } catch (error) {
      console.error('Error adding product:', error);
      console.error('Error details:', error.response ? error.response : error.message);
      setError('Failed to add product. Check console for details.');
    }
  };

  const handleBuyProduct = async (productAddress, productPrice) => {
    console.log("buy button ");
    if (!web3 || !accounts || accounts.length === 0) {
      setError('Web3, accounts, or contract not loaded properly.');
      return;
    }

    try {
      const productContract = new web3.eth.Contract(ProductABI.abi, productAddress);

      await productContract.methods.depositPurchase().send({
        from: accounts[0],
        value: productPrice,
      });

      console.log('Product purchased successfully!');
      await fetchProducts(factoryContract, web3); // Refresh the products list
    } catch (error) {
      console.error('Error purchasing product:', error);
      setError('Failed to purchase product. Check console for details.');
    }
  };

  const handleCreateDistributor = async (productAddress, fee) => {
    console.log("Creating distributor for product:", productAddress, "with fee:", fee);
    if (!web3 || !accounts || accounts.length === 0) {
      setError('Web3, accounts, or contract not loaded properly.');
      return;
    }

    try {
      const feeInWei = web3.utils.toWei(fee, 'wei');
      const productContract = new web3.eth.Contract(ProductABI.abi, productAddress);
      console.log("Product contract:", productContract);

      await productContract.methods.createTransporter(feeInWei).send({
        from: accounts[0],
      });

      console.log('Transporter created successfully!');
      await fetchProducts(factoryContract, web3); // Refresh the products list
    } catch (error) {
      console.error('Error creating transporter:', error);
      setError('Failed to create transporter. Check console for details.');
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
      <div className="container">
        {error && <div style={{ color: 'red' }}>{error}</div>}
        <h1>Decentralized Marketplace</h1>
        <BasicTabs value={tabIndex} handleChange={(event, newValue) => setTabIndex(newValue)}>
          <div label="SELLER">
            <SellerView
                products={products}
                setProducts={setProducts}
                handleAddProduct={handleAddProduct}
                web3={web3}
                contractAbi={ProductABI.abi}
                accounts={accounts}
            />
          </div>
          <div label="BUYER">
            <BuyerView
                products={products}
                web3={web3}
                accounts={accounts}
                handleBuyProduct={handleBuyProduct} // Pass the handleBuyProduct function
            />

          </div>
          <div label="DISTRIBUTOR">
            <DistributorView
                products={products}
                web3={web3}
                accounts={accounts}
            />
          </div>
        </BasicTabs>
      </div>
  );
};

export default App;
