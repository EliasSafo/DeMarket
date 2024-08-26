import React, { useState } from 'react';
import AddProductForm from '../AddProductForm/AddProductForm';
import ProductList from '../ProductList/ProductList';
import DistributorInfo from '../DistributorInfo/DistributorInfo';
import { getTransporters } from '../../utils/web3Utils';
import Modal from 'react-modal';

Modal.setAppElement('#root'); // This is important for accessibility, replace #root with your app element if different

const SellerView = ({ products, setProducts, handleAddProduct, web3, contractAbi, accounts }) => {
    const [productName, setProductName] = useState('');
    const [productPrice, setProductPrice] = useState('');
    const [tab, setTab] = useState('newProduct');
    const [distributors, setDistributors] = useState([[], []]); // Ensure it starts as an empty array structure
    const [showDistributors, setShowDistributors] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);

    const handleTabChange = (newTab) => {
        setTab(newTab);
    };

    const addProduct = () => {
        handleAddProduct(productName, productPrice);
        setProductName('');
        setProductPrice('');
    };

    const handleShowDistributors = async (product) => {
        console.log('product:', product);
        const transporterData = await getTransporters(web3, product.address);
        setDistributors(transporterData);
        setSelectedProduct(product);
        setShowDistributors(true);
    };

    const handleCloseDistributors = () => {
        setShowDistributors(false);
        setDistributors([[], []]); // Reset to empty array structure
        setSelectedProduct(null);
    };

    const handleSelectTransporter = async (transporterAddress, feeInWei) => {
        if (!selectedProduct) return;

        try {
            const productContract = new web3.eth.Contract(contractAbi, selectedProduct.address);
            await productContract.methods.setTransporter(transporterAddress).send({
                from: accounts[0],
                value: feeInWei, // Ensure fee is sent in wei
            });

            console.log('Transporter set successfully!');

            // Update the selectedProduct state to reflect the new transporter
            setSelectedProduct(prevState => ({ ...prevState, transporter: transporterAddress }));

            // Update the products array to reflect the new transporter
            const updatedProducts = products.map(product =>
                product.address === selectedProduct.address ? { ...product, transporter: transporterAddress } : product
            );

            setProducts(updatedProducts);

            setShowDistributors(false);
            setDistributors([[], []]); // Reset to empty array structure
            setSelectedProduct(null);

        } catch (error) {
            console.error('Error setting transporter:', error);
        }
    };

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
                            products={products}
                            web3={web3}
                            showButton={false}
                            handleBuyProduct={undefined}
                            handleShowDistributors={handleShowDistributors}
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
                web3={web3} // Ensure web3 is passed here
                contractAbi={contractAbi}
                accounts={accounts}
            />

        </div>
    );
};

export default SellerView;
