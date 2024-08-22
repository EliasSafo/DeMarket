import React from 'react';

const AddProductForm = ({ productName, setProductName, productPrice, setProductPrice, handleFileChange, handleAddProduct, uploading }) => {
    return (
        <div>
            <h2>Add a New Product</h2>
            <input
                type="text"
                placeholder="Product Name"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
            />
            <input
                type="text"
                placeholder="Product Price in ETH"
                value={productPrice}
                onChange={(e) => setProductPrice(e.target.value)}
            />
            <input type="file" onChange={handleFileChange} />
            <button onClick={handleAddProduct} disabled={uploading}>
                {uploading ? 'Uploading...' : 'Add Product'}
            </button>
        </div>
    );
};

export default AddProductForm;
