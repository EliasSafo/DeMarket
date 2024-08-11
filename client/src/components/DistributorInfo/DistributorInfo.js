import React, { useState } from 'react';
import Modal from 'react-modal';

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

const DistributorInfo = ({ selectedProduct, distributors, onClose, isOpen, onSelectTransporter }) => {
    const [showDistributorModal, setShowDistributorModal] = useState(false);
    const addresses = distributors[0] || [];
    const fees = distributors[1] || [];

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
