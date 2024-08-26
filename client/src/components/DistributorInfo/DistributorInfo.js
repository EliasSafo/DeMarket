import React, { useState } from 'react';
import Modal from 'react-modal';
import axios from 'axios';
import FormData from 'form-data';

const customStyles = {
    content: {
        top: '50%',
        left: '50%',
        right: 'auto',
        bottom: 'auto',
        marginRight: '-50%',
        transform: 'translate(-50%, -50%)',
    },
};

const DistributorInfo = ({ selectedProduct, distributors, onClose, isOpen, onSelectTransporter, web3, contractAbi, accounts }) => {
    const [showDistributorModal, setShowDistributorModal] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploading, setUploading] = useState(false);

    const addresses = distributors[0] || [];
    const fees = distributors[1] || [];

    const JWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiI2NDE3ZDNmYy03NWZhLTRhMWEtYTkxMi00ODRiYTQ2MzM0MGYiLCJlbWFpbCI6ImVsaWFzc2Fmb0BnbWFpbC5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwicGluX3BvbGljeSI6eyJyZWdpb25zIjpbeyJkZXNpcmVkUmVwbGljYXRpb25Db3VudCI6MSwiaWQiOiJGUkExIn0seyJkZXNpcmVkUmVwbGljYXRpb25Db3VudCI6MSwiaWQiOiJOWUMxIn1dLCJ2ZXJzaW9uIjoxfSwibWZhX2VuYWJsZWQiOmZhbHNlLCJzdGF0dXMiOiJBQ1RJVkUifSwiYXV0aGVudGljYXRpb25UeXBlIjoic2NvcGVkS2V5Iiwic2NvcGVkS2V5S2V5IjoiMDNlOWI0MzJkZWUxMTg5N2ZjNzEiLCJzY29wZWRLZXlTZWNyZXQiOiJjMTE5NzY3Y2UwZjdkZTk1OWQ0YTUyOGNiMTMzZmYzOWEzYzI1YjhkZGQ3OTE1NzMzNDhhNmYzZTlkZWJiOGZjIiwiZXhwIjoxNzU2MTQwMjc2fQ.H2wlHYkrZxmyQHJ13InrZ0ia7i8x8-q8Crkt44yrVuk'; // Replace with your actual JWT

    const handleFileChange = (e) => {
        setSelectedFile(e.target.files[0]);
    };

    const pinFileToIPFS = async () => {
        const formData = new FormData();
        formData.append('file', selectedFile);

        const pinataMetadata = JSON.stringify({ name: selectedProduct.name });
        formData.append('pinataMetadata', pinataMetadata);

        const pinataOptions = JSON.stringify({ cidVersion: 0 });
        formData.append('pinataOptions', pinataOptions);

        try {
            setUploading(true);
            const res = await axios.post("https://api.pinata.cloud/pinning/pinFileToIPFS", formData, {
                maxBodyLength: "Infinity",
                headers: {
                    'Content-Type': `multipart/form-data; boundary=${formData._boundary}`,
                    'Authorization': `Bearer ${JWT}`
                }
            });
            console.log('IPFS Hash:', res.data.IpfsHash);
            setUploading(false);
            return res.data.IpfsHash;
        } catch (error) {
            console.error('Error uploading file to IPFS:', error);
            setUploading(false);
            return null;
        }
    };

    const handleConfirmOrder = async () => {
        console.log('selectedFile:', selectedFile);
        console.log('selectedProduct:', selectedProduct);
        console.log('web3:', web3);

        if (!selectedFile || !selectedProduct || !web3 || !accounts || !contractAbi) {
            alert('Please select a file to upload, ensure a product is selected, and that web3 is properly initialized.');
            return;
        }

        const vcCID = await pinFileToIPFS();
        if (vcCID) {
            try {
                const productContract = new web3.eth.Contract(contractAbi, selectedProduct.address);
                await productContract.methods.confirmOrder(vcCID).send({
                    from: accounts[0],
                });

                console.log('Order confirmed successfully with VC CID:', vcCID);
                setSelectedFile(null);
                onClose();
            } catch (error) {
                console.error('Error confirming order:', error);
            }
        }
    };


    const handleSelectTransporter = (address, fee) => {
        onSelectTransporter(address, fee);
        setShowDistributorModal(false);
    };

    const openDistributorModal = () => {
        setShowDistributorModal(true);
    };

    const closeDistributorModal = () => {
        setShowDistributorModal(false);
    };

    const isDistributorSet = selectedProduct && selectedProduct.transporter && selectedProduct.transporter !== '0x0000000000000000000000000000000000000000';

    return (
        <>
            <Modal
                isOpen={isOpen}
                onRequestClose={onClose}
                style={customStyles}
                contentLabel="Product Info"
            >
                <button onClick={onClose}>Close</button>
                {selectedProduct && (
                    <>
                        <h2>{selectedProduct.name}</h2>
                        <div>
                            <strong>Deliverer:</strong>
                            {isDistributorSet ? (
                                <span>{selectedProduct.transporter}</span>
                            ) : (
                                <button onClick={openDistributorModal}>Set Distributor</button>
                            )}
                        </div>
                        <div>
                            <strong>Status:</strong>
                            <span>{selectedProduct.purchased ? 'Purchased' : 'Available'}</span>
                        </div>
                        <div>
                            <strong>Buyer:</strong>
                            <span>{selectedProduct.buyer || 'Not purchased yet'}</span>
                        </div>
                        <div>
                            <input type="file" onChange={handleFileChange} />
                            <button onClick={handleConfirmOrder} disabled={uploading}>
                                {uploading ? 'Uploading...' : 'Confirm Order'}
                            </button>
                        </div>
                    </>
                )}
            </Modal>
            <Modal
                isOpen={showDistributorModal}
                onRequestClose={closeDistributorModal}
                style={customStyles}
                contentLabel="Select Distributor"
            >
                <button onClick={closeDistributorModal}>Close</button>
                <h3>Available Distributors</h3>
                <ul>
                    {addresses.map((address, index) => (
                        <li key={index}>
                            Address: {address}, Fee: {fees[index].toString()} wei
                            <button onClick={() => handleSelectTransporter(address, fees[index])}>Select</button>
                        </li>
                    ))}
                </ul>
            </Modal>
        </>
    );
};

export default DistributorInfo;
