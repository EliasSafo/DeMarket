import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';
import ProductList from '../ProductList/ProductList';
import './DistributorView.css'; // Ensure you create and import a CSS file for styling

Modal.setAppElement('#root');

const DistributorView = ({ products, web3, accounts, handleCreateDistributor }) => {
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [price, setPrice] = useState('');
    const [tab, setTab] = useState('offers'); // State to handle selected tab

    const handleOpenModal = (product) => {
        console.log("product:", product);
        setSelectedProduct(product);
    };

    const handleCloseModal = () => {
        setSelectedProduct(null);
        setShowModal(false);
        setPrice('');
    };

    const handleInputChange = (e) => {
        setPrice(e.target.value);
    };

    const handleSetPrice = async () => {
        if (!selectedProduct) return;
        console.log("test")
        try {
            const feeInWei = web3.utils.toWei(price, 'wei');
            console.log(`Creating distributor for product: ${selectedProduct.address}, fee: ${feeInWei}`);
            await handleCreateDistributor(selectedProduct.address, feeInWei);
            handleCloseModal();
        } catch (error) {
            console.error('Error setting price:', error);
        }
    };

    const handleTabChange = (newTab) => {
        setTab(newTab);
    };

    useEffect(() => {
        console.log('Products:', products);
        console.log('Accounts:', accounts);
    }, [products, accounts]);

    useEffect(() => {
        if (selectedProduct) {
            console.log('Selected Product:', selectedProduct);
            setShowModal(true);
        }
    }, [selectedProduct]);

    const inProgressProducts = products.filter(product => product.transporter === accounts[0]);

    return (
        <div className="distributor-view">
            <div className="tabs">
                <button className={tab === 'offers' ? 'active' : ''} onClick={() => handleTabChange('offers')}>Offers</button>
                <button className={tab === 'inProgress' ? 'active' : ''} onClick={() => handleTabChange('inProgress')}>In Progress</button>
            </div>
            <div className="content">
                {tab === 'offers' && (
                    <>
                        <h2>Products Available for Delivery</h2>
                        <ProductList
                            products={products}
                            web3={web3}
                            showButton={true}
                            handleShowDistributors={handleOpenModal}
                        />
                    </>
                )}
                {tab === 'inProgress' && (
                    <>
                        <h2>Products In Progress</h2>
                        <ProductList
                            products={inProgressProducts}
                            web3={web3}
                            showButton={false}
                        />
                    </>
                )}
            </div>
            <Modal
                isOpen={showModal}
                onRequestClose={handleCloseModal}
                style={{
                    content: {
                        top: '50%',
                        left: '50%',
                        right: 'auto',
                        bottom: 'auto',
                        marginRight: '-50%',
                        transform: 'translate(-50%, -50%)',
                    },
                }}
                contentLabel="Set Delivery Price"
            >
                <h2>Set Delivery Price</h2>
                {selectedProduct && (
                    <div>
                        <p>Product: {selectedProduct.name}</p>
                        <p>Owner: {selectedProduct.owner}</p>
                    </div>
                )}
                <input
                    type="text"
                    value={price}
                    onChange={handleInputChange}
                    placeholder="Enter delivery price in wei"
                />
                <button onClick={handleSetPrice}>Set Price</button>
                <button onClick={handleCloseModal}>Close</button>
            </Modal>
        </div>
    );
};

export default DistributorView;
