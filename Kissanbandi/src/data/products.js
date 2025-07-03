// Product Categories with subcategories
export const categories = [
  {
    name: "Fruits",
    subcategories: ["Seasonal Fruits", "Exotic Fruits", "Organic Fruits", "Citrus Fruits"]
  },
  {
    name: "Vegetables",
    subcategories: ["Fresh Vegetables", "Organic Vegetables", "Root Vegetables", "Leafy Greens","Seasonal Vegetables"]
  },
  {
    name: "Herbs",
    subcategories: ["Fresh Herbs", "Dried Herbs", "Medicinal Herbs", "Organic Herbs"]
  }
];

// Dummy Products Data
export const allProducts = [
  {
    id: 1,
    name: "Fresh Alphonso Mangoes",
    category: "fruits",
    subcategory: "Seasonal Fruits",
    price: 399,
    unit: "kg",
    stock: 150,
    rating: 4.8,
    reviews: 245,
    image: "https://images.unsplash.com/photo-1553279768-865429fa0078",
    description: "Premium Alphonso mangoes from Ratnagiri. Sweet, aromatic, and perfect ripeness.",
    status: "active"
  },
  {
    id: 2,
    name: "Organic Tomatoes",
    category: "vegetables",
    subcategory: "Organic Vegetables",
    price: 60,
    unit: "kg",
    stock: 200,
    rating: 4.5,
    reviews: 180,
    image: "https://images.unsplash.com/photo-1546470427-227c7162b825",
    description: "Farm-fresh organic tomatoes. Perfect for salads and cooking.",
    status: "active"
  },
  {
    id: 3,
    name: "Fresh Mint Leaves",
    category: "herbs",
    subcategory: "Fresh Herbs",
    price: 30,
    unit: "bunch",
    stock: 100,
    rating: 4.6,
    reviews: 120,
    image: "https://images.unsplash.com/photo-1628614181317-4a0c7b478171",
    description: "Fresh and aromatic mint leaves. Perfect for garnishing and beverages.",
    status: "active"
  },
  {
    id: 4,
    name: "Dragon Fruit",
    category: "fruits",
    subcategory: "Exotic Fruits",
    price: 199,
    unit: "piece",
    stock: 75,
    rating: 4.7,
    reviews: 95,
    image: "https://images.unsplash.com/photo-1527325678964-54921661f888",
    description: "Exotic dragon fruit with vibrant pink flesh. Rich in antioxidants.",
    status: "active"
  },
  {
    id: 5,
    name: "Baby Spinach",
    category: "vegetables",
    subcategory: "Leafy Greens",
    price: 45,
    unit: "bunch",
    stock: 120,
    rating: 4.4,
    reviews: 156,
    image: "https://images.unsplash.com/photo-1576045057995-568f588f82fb",
    description: "Tender baby spinach leaves. Perfect for salads and smoothies.",
    status: "active"
  },
  {
    id: 6,
    name: "Organic Turmeric",
    category: "herbs",
    subcategory: "Medicinal Herbs",
    price: 180,
    unit: "kg",
    stock: 80,
    rating: 4.9,
    reviews: 200,
    image: "https://images.unsplash.com/photo-1615485500704-8e990f9900f7",
    description: "Fresh organic turmeric root. Known for its medicinal properties.",
    status: "active"
  },
  {
    id: 7,
    name: "Sweet Strawberries",
    category: "fruits",
    subcategory: "Seasonal Fruits",
    price: 299,
    unit: "box",
    stock: 100,
    rating: 4.6,
    reviews: 178,
    image: "https://images.unsplash.com/photo-1587393855524-087f83d95bc9",
    description: "Sweet and juicy strawberries. Perfect for desserts and snacking.",
    status: "active"
  },
  {
    id: 8,
    name: "Red Bell Peppers",
    category: "vegetables",
    subcategory: "Fresh Vegetables",
    price: 120,
    unit: "kg",
    stock: 90,
    rating: 4.3,
    reviews: 145,
    image: "https://images.unsplash.com/photo-1592924357228-91a4daadcfea",
    description: "Crisp and colorful red bell peppers. Rich in vitamins.",
    status: "active"
  },
  {
    id: 9,
    name: "Fresh Basil",
    category: "herbs",
    subcategory: "Fresh Herbs",
    price: 40,
    unit: "bunch",
    stock: 85,
    rating: 4.7,
    reviews: 134,
    image: "https://images.unsplash.com/photo-1618164435735-413d3b066c9a",
    description: "Aromatic fresh basil leaves. Essential for Italian cuisine.",
    status: "active"
  },
  {
    id: 10,
    name: "Organic Sweet Lime",
    category: "fruits",
    subcategory: "Citrus Fruits",
    price: 89,
    unit: "kg",
    stock: 130,
    rating: 4.5,
    reviews: 167,
    image: "https://images.unsplash.com/photo-1621506289937-a8e4df240d0b",
    description: "Juicy organic sweet limes. Rich in Vitamin C.",
    status: "active"
  },
  {
    id: 11,
    name: "Baby Carrots",
    category: "vegetables",
    subcategory: "Root Vegetables",
    price: 70,
    unit: "kg",
    stock: 110,
    rating: 4.4,
    reviews: 143,
    image: "https://images.unsplash.com/photo-1598170845058-32b9d6a5da37",
    description: "Sweet and tender baby carrots. Perfect for snacking.",
    status: "active"
  },
  {
    id: 12,
    name: "Dried Rosemary",
    category: "herbs",
    subcategory: "Dried Herbs",
    price: 99,
    unit: "50g",
    stock: 70,
    rating: 4.8,
    reviews: 89,
    image: "https://images.unsplash.com/photo-1615485290382-441e4d049cb5",
    description: "Aromatic dried rosemary. Perfect for seasoning.",
    status: "active"
  },
  {
    id: 13,
    name: "Organic Avocados",
    category: "fruits",
    subcategory: "Organic Fruits",
    price: 159,
    unit: "piece",
    stock: 95,
    rating: 4.7,
    reviews: 156,
    image: "https://images.unsplash.com/photo-1523049673857-eb18f1d7b578",
    description: "Creamy organic avocados. Rich in healthy fats.",
    status: "active"
  },
  {
    id: 14,
    name: "Purple Cabbage",
    category: "vegetables",
    subcategory: "Fresh Vegetables",
    price: 55,
    unit: "piece",
    stock: 85,
    rating: 4.3,
    reviews: 112,
    image: "https://images.unsplash.com/photo-1506807803488-8eafc15316c7",
    description: "Fresh purple cabbage. Great for salads and slaws.",
    status: "active"
  },
  {
    id: 15,
    name: "Organic Sage",
    category: "herbs",
    subcategory: "Organic Herbs",
    price: 45,
    unit: "bunch",
    stock: 60,
    rating: 4.6,
    reviews: 78,
    image: "https://images.unsplash.com/photo-1600831606133-c5c9b5a23d2c",
    description: "Fresh organic sage leaves. Perfect for seasoning.",
    status: "active"
  }
];

// Helper Functions
export const getProductsByCategory = (category, subcategory = null) => {
  return allProducts.filter(product => 
    product.category === category.toLowerCase() &&
    (!subcategory || product.subcategory === subcategory)
  );
};

export const getProductById = (id) => {
  return allProducts.find(product => product.id === id);
};

export const getFeaturedProducts = () => {
  return allProducts.filter(product => product.rating >= 4.5);
};

export const searchProducts = (query) => {
  const searchTerm = query.toLowerCase();
  return allProducts.filter(product => 
    product.name.toLowerCase().includes(searchTerm) ||
    product.description.toLowerCase().includes(searchTerm) ||
    product.category.toLowerCase().includes(searchTerm) ||
    product.subcategory.toLowerCase().includes(searchTerm)
  );
};