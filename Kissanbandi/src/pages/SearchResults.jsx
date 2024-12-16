import React, { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useCart } from '../pages/checkout/CartContext';
import { Star } from 'lucide-react';
import toast from 'react-hot-toast';

const SearchResults = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q')?.toLowerCase() || '';
  const { dispatch } = useCart();

  // Import your product data
  const allProducts = [
    // Your product array from before
  ];

  const searchResults = useMemo(() => {
    return allProducts.filter(product => 
      product.name.toLowerCase().includes(query) ||
      product.category.toLowerCase().includes(query) ||
      product.description.toLowerCase().includes(query)
    );
  }, [query]);

  const handleAddToCart = (product) => {
    dispatch({ 
      type: 'ADD_TO_CART', 
      payload: product 
    });
    toast.success(`Added ${product.name} to cart!`);
  };

  return (
    <div className="container mx-auto px-4 py-8 mt-32">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">
          Search Results for "{query}"
        </h1>
        <p className="text-gray-600 mt-2">
          Found {searchResults.length} items
        </p>
      </div>

      {searchResults.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600">
            No products found matching "{query}". Try a different search term.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {searchResults.map((product) => (
            <div 
              key={product.id} 
              className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-300"
            >
              <div className="relative">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-48 object-cover"
                />
              </div>
              
              <div className="p-4">
                <div className="text-sm text-green-600 font-medium mb-1 capitalize">
                  {product.category}
                </div>
                <h3 className="text-lg font-semibold text-gray-800">{product.name}</h3>
                
                <div className="flex items-center mt-2">
                  <div className="flex items-center">
                    <Star className="w-5 h-5 text-yellow-400 fill-current" />
                    <span className="ml-1 text-gray-600">{product.rating}</span>
                  </div>
                  <span className="mx-2 text-gray-400">•</span>
                  <span className="text-gray-600">{product.reviews} reviews</span>
                </div>

                <div className="flex justify-between items-center mt-4">
                  <div className="text-lg font-bold text-gray-800">
                    ₹{product.price}
                    <span className="text-sm text-gray-600 font-normal">/{product.unit}</span>
                  </div>
                  <button 
                    onClick={() => handleAddToCart(product)}
                    className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition duration-300"
                  >
                    Add to Cart
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchResults;