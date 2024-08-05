import React from 'react';
import TransporterForm from '../TransporterForm/TransporterForm';

const DistributorView = ({ products, web3,handleCreateDistributor }) => {
    return (
        <div className="distributor-view">
            <TransporterForm products={products} web3={web3} handleCreateDistributor={handleCreateDistributor}/>
        </div>
    );
};

export default DistributorView;
