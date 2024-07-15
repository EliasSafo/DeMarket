import React from 'react';

const AddProductForm = ({ productName, setProductName, productPrice, setProductPrice, handleAddProduct }) => {
    return (
        <div>
            <h2>Add Product</h2>
            <form>
                <input
                    type="text"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    placeholder="Product Name"
                />
                <input
                    type="text"
                    value={productPrice}
                    onChange={(e) => setProductPrice(e.target.value)}
                    placeholder="Product Price (ETH)"
                />
                <button type="button" onClick={handleAddProduct}>Add Product</button>
            </form>
        </div>
    );
};

export default AddProductForm;
