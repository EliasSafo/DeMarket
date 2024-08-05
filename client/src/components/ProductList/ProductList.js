import React from 'react';

const ProductList = ({ products, web3,showButton, handleBuyProduct}) => {
  if (!web3 || !web3.utils) {
    console.error('Web3 is not initialized or missing utils');
    return null;
  }

  return (
      <div className="product-list">
        {products.map(product => (
            <div key={product.address} className="product-card">
              <img src={product.image} alt={product.name} />
              <h3>{product.name}</h3>
              <p>Price: {web3.utils.fromWei(product.price.toString(), 'ether')} ETH</p>
              <p>Owner: {product.owner}</p>
              <p>Purchased: {product.purchased ? 'Yes' : 'No'}</p>
              {showButton && <button onClick={() => handleBuyProduct(product.address, product.price)}>Buy</button>}
            </div>
        ))}
      </div>
  );
};

export default ProductList;
