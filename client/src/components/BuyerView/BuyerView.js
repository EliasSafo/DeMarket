import React, { useState } from 'react';
import ProductList from '../ProductList/ProductList';
import Modal from 'react-modal';
import ProductABI from '../../abis/ProductEscrow.json'; // Import ProductABI

const BuyerView = ({ products, web3, handleBuyProduct, accounts }) => {
    const [tab, setTab] = useState('sale');
    const [search, setSearch] = useState('');
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [showConfirmModal, setShowConfirmModal] = useState(false);

    const handleTabChange = (newTab) => {
        setTab(newTab);
    };

    const handleSearchChange = (e) => {
        setSearch(e.target.value);
    };

    const handleConfirmDelivery = (product) => {
        setSelectedProduct(product);
        setShowConfirmModal(true);
    };

    const handleConfirmDeliveryAction = async () => {
        if (!selectedProduct) return;

        try {
            const productContract = new web3.eth.Contract(ProductABI.abi, selectedProduct.address);
            await productContract.methods.confirmDelivery().send({
                from: accounts[0],
            });

            console.log('Delivery confirmed successfully!');
            setShowConfirmModal(false);
            setSelectedProduct(null);

            // Optionally refresh products list
            // await fetchProducts(...);
        } catch (error) {
            console.error('Error confirming delivery:', error);
        }
    };

    return (
        <div className="buyer-view">
            <div className="tabs" style={{ float: 'left', width: '10%' }}>
                <button onClick={() => handleTabChange('sale')}>Sale</button>
                <button onClick={() => handleTabChange('inProgress')}>In Progress</button>
            </div>
            <div>
                <div className="search">
                    <input
                        type="text"
                        placeholder="Search products..."
                        value={search}
                        onChange={handleSearchChange}
                    />
                </div>
                <div className="content">
                    {tab === 'sale' && (
                        <ProductList
                            products={products} // Show all products
                            web3={web3}
                            showButton={true}
                            handleBuyProduct={handleBuyProduct}
                        />
                    )}
                    {tab === 'inProgress' && (
                        <ProductList
                            products={products} // Show all products
                            web3={web3}
                            showButton={false} // No buy button needed for in-progress purchases
                            customButtons={product => (
                                <button onClick={() => handleConfirmDelivery(product)}>
                                    Confirm Delivery
                                </button>
                            )}
                        />
                    )}
                </div>
            </div>
            <Modal
                isOpen={showConfirmModal}
                onRequestClose={() => setShowConfirmModal(false)}
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
                contentLabel="Confirm Delivery"
            >
                <h2>Confirm Delivery</h2>
                <p>
                    Are you sure you want to confirm delivery? This action will pay all parties
                    involved, and it should only be done once the product has been delivered.
                </p>
                <button onClick={handleConfirmDeliveryAction}>Confirm</button>
                <button onClick={() => setShowConfirmModal(false)}>Cancel</button>
            </Modal>
        </div>
    );
};

export default BuyerView;
