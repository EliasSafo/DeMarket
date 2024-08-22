import React, { useState } from 'react';
import ProductList from '../ProductList/ProductList';
import Modal from 'react-modal';
import ProductABI from '../../abis/ProductEscrow.json'; // Import ProductABI
import axios from 'axios';

const BuyerView = ({ products, web3, accounts }) => {
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

    const downloadFileFromPinata = async (cid) => {
        try {
            const url = `https://plum-eligible-puma-63.mypinata.cloud/ipfs/${cid}`;
            const response = await axios.get(url, {
                responseType: 'json', // Expect JSON data
            });

            // Create a link element to download the file as JSON
            const urlBlob = window.URL.createObjectURL(new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' }));
            const link = document.createElement('a');
            link.href = urlBlob;
            link.setAttribute('download', 'verifiable-credentials.json'); // Name of the downloaded file
            document.body.appendChild(link);
            link.click();

            // Clean up the link after download
            link.parentNode.removeChild(link);

        } catch (error) {
            console.error('Error downloading file from Pinata:', error);
        }
    };

    const handleBuyProductWithDownload = async (productAddress, productPrice) => {
        try {
            console.log("Attempting to purchase product...");
            const productContract = new web3.eth.Contract(ProductABI.abi, productAddress);

            await productContract.methods.depositPurchase().send({
                from: accounts[0],
                value: productPrice,
            });

            console.log('Product purchased successfully!');

            // Retrieve the CID from the smart contract
            const cid = await productContract.methods.getCid().call();
            console.log('Retrieved CID:', cid);

            // Download the file from Pinata using the CID
            await downloadFileFromPinata(cid);

        } catch (error) {
            console.error('Error purchasing product and downloading VC:', error);
        }
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
                            handleBuyProduct={handleBuyProductWithDownload} // Use the new handleBuyProductWithDownload function
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
