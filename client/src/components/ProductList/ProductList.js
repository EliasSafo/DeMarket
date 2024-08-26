import React from 'react';

const ProductList = ({ products, web3, showButton, handleBuyProduct, handleShowDistributors }) => {
  if (!web3 || !web3.utils) {
    console.error('Web3 is not initialized or missing utils');
    return null;
  }

  if (!products || products.length === 0) {
    return <div>No products available</div>;
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
              {product.vcCID && (
                  <div>
                    <strong>VC CID:</strong>
                    <p>{product.vcCID}</p>
                  </div>
              )}
              {showButton && handleBuyProduct && (
                  <button onClick={() => handleBuyProduct(product.address, product.price)}>Buy</button>
              )}
              {handleShowDistributors && (
                  <button onClick={() => handleShowDistributors(product)}>Info</button>
              )}
            </div>
        ))}
      </div>
  );
};

export default ProductList;
