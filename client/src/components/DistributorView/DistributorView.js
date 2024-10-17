import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';
import ProductList from '../ProductList/ProductList';
import './DistributorView.css'; // Ensure you create and import a CSS file for styling
import ProductABI from '../../abis/ProductEscrow.json';

Modal.setAppElement('#root');

const DistributorView = ({ products, web3, accounts, handleCreateDistributor }) => {
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [price, setPrice] = useState('');
    const [tab, setTab] = useState('offers'); // State to handle selected tab

    const handleOpenModal = (product) => {
        console.log("product:", product);
        setSelectedProduct(product);
        setShowModal(true);
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

        try {
            await handleCreateDistributor(selectedProduct.address, price);
            handleCloseModal();
        } catch (error) {
            console.error('Error setting price:', error);
        }
    };

    const handleSecurityDeposit = async () => {
        if (!selectedProduct) return;

        try {
            const productContract = new web3.eth.Contract(ProductABI.abi, selectedProduct.address);
            const depositAmount = selectedProduct.price; // Assuming price is the required deposit
            await productContract.methods.securityDeposit().send({
                from: accounts[0],
                value: depositAmount,
            });

            console.log('Security deposit made successfully!');
            handleCloseModal();
        } catch (error) {
            console.error('Error making security deposit:', error);
        }
    };

    const handleTabChange = (newTab) => {
        setTab(newTab);
    };

    useEffect(() => {
        console.log('Products:', products);
        console.log('Accounts:', accounts);
    }, [products, accounts]);

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
                            handleShowDistributors={handleOpenModal} // Opens modal for setting delivery price
                        />
                    </>
                )}
                {tab === 'inProgress' && (
                    <>
                        <h2>Products In Progress</h2>
                        <ProductList
                            products={products} // No filter, display all products
                            web3={web3}
                            showButton={false}
                            handleShowDistributors={handleOpenModal} // Reuse the same modal for security deposit
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
                contentLabel="Distributor Modal"
            >
                {selectedProduct && (
                    <>
                        <h2>{tab === 'offers' ? 'Set Delivery Price' : 'Security Deposit'}</h2>
                        <div>
                            <p><strong>Product:</strong> {selectedProduct.name}</p>
                            <p><strong>Owner:</strong> {selectedProduct.owner}</p>
                            <p><strong>Price:</strong> {web3.utils.fromWei(selectedProduct.price.toString(), 'ether')} ETH</p>
                            <p><strong>Buyer:</strong> {selectedProduct.buyer || 'Not purchased yet'}</p>
                            <p><strong>Distributor:</strong> {selectedProduct.transporter || 'Not set'}</p>
                        </div>
                        {tab === 'offers' ? (
                            <>
                                <input
                                    type="text"
                                    value={price}
                                    onChange={handleInputChange}
                                    placeholder="Enter delivery price in wei"
                                />
                                <button onClick={handleSetPrice}>Set Price</button>
                            </>
                        ) : (
                            <button onClick={handleSecurityDeposit}>Make Security Deposit</button>
                        )}
                        <button onClick={handleCloseModal}>Close</button>
                    </>
                )}
            </Modal>
        </div>
    );
};

export default DistributorView;
