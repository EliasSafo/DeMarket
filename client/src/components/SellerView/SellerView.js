import React, { useState } from 'react';
import AddProductForm from '../AddProductForm/AddProductForm';
import ProductList from '../ProductList/ProductList';

const SellerView = ({ products, handleAddProduct, web3 }) => {
    const [productName, setProductName] = useState('');
    const [productPrice, setProductPrice] = useState('');
    const [tab, setTab] = useState('newProduct');

    const handleTabChange = (newTab) => {
        setTab(newTab);
    };

    const addProduct = () => {
        handleAddProduct(productName, productPrice);
        setProductName('');
        setProductPrice('');
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
                        <ProductList products={products.filter(product => !product.purchased)} web3={web3} showButton={false} handleBuyProduct={undefined}/>
                        </>
                    )}
                    {tab === 'inProgress' && (
                        <ProductList products={products.filter(product => !product.purchased)} web3={web3} showButton={false} handleBuyProduct={undefined}/>
                    )}
                    {tab === 'delivered' && (
                        <ProductList products={products.filter(product => product.purchased)} web3={web3} showButton={false} handleBuyProduct={undefined}/>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SellerView;
