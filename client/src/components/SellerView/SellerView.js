import React, { useState, useEffect } from 'react';
import AddProductForm from '../AddProductForm/AddProductForm';
import ProductList from '../ProductList/ProductList';
import DistributorInfo from '../DistributorInfo/DistributorInfo';
import { getTransporters } from '../../utils/web3Utils';
import Modal from 'react-modal';

Modal.setAppElement('#root'); // Accessibility

const SellerView = ({ products, setProducts, handleAddProduct, web3, contractAbi, accounts }) => {
    const [productName, setProductName] = useState('');
    const [productPrice, setProductPrice] = useState('');
    const [tab, setTab] = useState('newProduct');
    const [distributors, setDistributors] = useState([[], []]);
    const [showDistributors, setShowDistributors] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [deliveredProducts, setDeliveredProducts] = useState([]);

    const handleTabChange = (newTab) => {
        setTab(newTab);
    };

    const addProduct = () => {
        handleAddProduct(productName, productPrice);
        setProductName('');
        setProductPrice('');
    };

    const handleShowDistributors = async (product) => {
        const transporterData = await getTransporters(web3, product.address);
        setDistributors(transporterData);
        setSelectedProduct(product);
        setShowDistributors(true);
    };

    const handleCloseDistributors = () => {
        setShowDistributors(false);
        setDistributors([[], []]); // Reset
        setSelectedProduct(null);
    };

    const handleSelectTransporter = async (transporterAddress, feeInWei) => {
        if (!selectedProduct) return;

        try {
            const productContract = new web3.eth.Contract(contractAbi, selectedProduct.address);
            await productContract.methods.setTransporter(transporterAddress).send({
                from: accounts[0],
                value: feeInWei, // Send fee in wei
            });

            // Update selectedProduct and products
            setSelectedProduct(prevState => ({ ...prevState, transporter: transporterAddress }));
            const updatedProducts = products.map(product =>
                product.address === selectedProduct.address ? { ...product, transporter: transporterAddress } : product
            );
            setProducts(updatedProducts);
            setShowDistributors(false);
        } catch (error) {
            console.error('Error setting transporter:', error);
        }
    };

    useEffect(() => {
        const listenForDeliveryConfirmed = async () => {
            if (!web3 || !accounts || !contractAbi || products.length === 0) return;

            for (let product of products) {
                try {
                    const productContract = new web3.eth.Contract(contractAbi, product.address);

                    if (productContract && productContract.events) {
                        productContract.events.DeliveryConfirmed({
                            filter: { owner: accounts[0] },
                            fromBlock: 'latest',
                        })
                            .on('data', (event) => {
                                const { buyer, transporter, price, vcCID } = event.returnValues;

                                const deliveredProduct = {
                                    ...product,
                                    vcCID, // Add the VC CID to the product
                                    buyer,
                                    transporter,
                                    price,
                                };

                                // Update deliveredProducts without overwriting existing products
                                setDeliveredProducts((prevState) => {
                                    const existingProduct = prevState.find(p => p.address === product.address);

                                    // If the product already exists, update its VC CID
                                    if (existingProduct) {
                                        return prevState.map(p =>
                                            p.address === product.address
                                                ? { ...p, vcCID } // Update only the vcCID
                                                : p
                                        );
                                    } else {
                                        return [...prevState, deliveredProduct]; // Add new product
                                    }
                                });
                            })
                            .on('error', (error) => console.error('Event listener error:', error));
                    } else {
                        console.error('Event subscription or contract not found');
                    }
                } catch (error) {
                    console.error('Error in setting up event listener:', error);
                }
            }
        };

        listenForDeliveryConfirmed();
    }, [products, web3, accounts, contractAbi]);

    return (
        <div className="seller-view">
            <div className="tabs" style={{ float: 'left', width: '15%', height: '100vh', backgroundColor: '#f1f1f1' }}>
                <button className={tab === 'newProduct' ? 'active' : ''} onClick={() => handleTabChange('newProduct')}>New Product</button>
                <button className={tab === 'inProgress' ? 'active' : ''} onClick={() => handleTabChange('inProgress')}>In Progress</button>
                <button className={tab === 'delivered' ? 'active' : ''} onClick={() => handleTabChange('delivered')}>Delivered</button>
            </div>
            <div style={{ marginLeft: '15%', padding: '10px' }}>
                <div className="content">
                    {tab === 'newProduct' && (
                        <>
                            <AddProductForm
                                productName={productName}
                                setProductName={setProductName}
                                productPrice={productPrice}
                                setProductPrice={setProductPrice}
                                handleAddProduct={addProduct}
                            />
                            <ProductList
                                products={products}
                                web3={web3}
                                showButton={false}
                                handleBuyProduct={undefined}
                                handleShowDistributors={handleShowDistributors}
                            />
                        </>
                    )}
                    {tab === 'inProgress' && (
                        <ProductList
                            products={products}
                            web3={web3}
                            showButton={false}
                            handleBuyProduct={undefined}
                            handleShowDistributors={handleShowDistributors}
                        />
                    )}
                    {tab === 'delivered' && (
                        <ProductList
                            products={deliveredProducts} // Show only delivered products
                            web3={web3}
                            showButton={false}
                            handleBuyProduct={undefined}
                            customAction={(product) => (
                                <a
                                    href={`https://plum-eligible-puma-63.mypinata.cloud/ipfs/${product.vcCID}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    download
                                >
                                    View VC
                                </a>
                            )}
                        />
                    )}
                </div>
            </div>
            <DistributorInfo
                selectedProduct={selectedProduct}
                distributors={distributors}
                onClose={handleCloseDistributors}
                isOpen={showDistributors}
                onSelectTransporter={handleSelectTransporter}
                web3={web3}
                contractAbi={contractAbi}
                accounts={accounts}
            />
        </div>
    );
};

export default SellerView;
