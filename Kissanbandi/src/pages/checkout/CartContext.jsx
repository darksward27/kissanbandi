import React, { createContext, useContext, useReducer, useEffect, useState } from 'react';
import { useAuth } from './AuthProvider';
import toast from 'react-hot-toast';

const CartContext = createContext();

const cartReducer = (state, action) => {
  switch (action.type) {
    case 'ADD_TO_CART':
      console.log("Adding to cart:", action.payload);
      
      const existingItem = state.items.find(item =>
        (item.id || item._id) === (action.payload.id || action.payload._id) &&
        item.size === action.payload.size &&
        item.color === action.payload.color
      );

      if (existingItem) {
        // Check stock limit before incrementing
        const maxQty = existingItem.stock ?? Infinity;
        const newQuantity = existingItem.quantity + (action.payload.quantity || 1);
        
        if (newQuantity <= maxQty) {
          return {
            ...state,
            items: state.items.map(item =>
              (item.id || item._id) === (action.payload.id || action.payload._id) &&
              item.size === action.payload.size &&
              item.color === action.payload.color
                ? { ...item, quantity: newQuantity }
                : item
            ),
          };
        } else {
          // Show toast for stock limit exceeded
          toast.error(`Only ${maxQty} items available in stock`);
          return state;
        }
      }
      
      // New item - add to cart with specified quantity or default to 1
      return {
        ...state,
        items: [...state.items, { 
          ...action.payload, 
          quantity: action.payload.quantity || 1 
        }],
      };

    case 'INIT_CART':
      return {
        ...state,
        items: action.payload,
      };

    case 'REMOVE_FROM_CART':
      if (
        !action.payload ||
        typeof action.payload !== 'object' ||
        !('id' in action.payload)
      ) {
        console.error("Invalid REMOVE_FROM_CART payload:", action.payload);
        return state;
      }

      return {
        ...state,
        items: state.items.filter(item =>
          !(
            (item.id || item._id) === action.payload.id &&
            item.size === action.payload.size &&
            item.color === action.payload.color
          )
        ),
      };

    case 'UPDATE_QUANTITY':
      // Validate quantity before updating
      const targetItem = state.items.find(item =>
        (item.id || item._id) === action.payload.id &&
        item.size === action.payload.size &&
        item.color === action.payload.color
      );

      if (targetItem) {
        const maxQty = targetItem.stock ?? Infinity;
        
        if (action.payload.quantity > maxQty) {
          toast.error(`Only ${maxQty} items available in stock`);
          return state;
        }
        
        if (action.payload.quantity < 1) {
          return state;
        }
      }

      return {
        ...state,
        items: state.items.map(item =>
          (item.id || item._id) === action.payload.id &&
          item.size === action.payload.size &&
          item.color === action.payload.color
            ? { ...item, quantity: action.payload.quantity }
            : item
        ),
      };

    case 'CLEAR_CART':
      return {
        ...state,
        items: [],
      };

    default:
      return state;
  }
};

const getInitialCart = (userId) => {
  try {
    const storedCart = localStorage.getItem(`cart_${userId}`);
    return storedCart ? JSON.parse(storedCart) : { items: [] };
  } catch (error) {
    console.error('Failed to load cart from localStorage:', error);
    return { items: [] };
  }
};

export const CartProvider = ({ children }) => {
  const auth = useAuth();
  const loading = auth?.loading;
  const userId = auth?.user?._id || 'guest';

  const [state, dispatch] = useReducer(
    cartReducer,
    undefined,
    () => getInitialCart(userId)
  );
  
  const [initialized, setInitialized] = useState(false);

  // Load cart when auth or userId changes
  useEffect(() => {
    if (!loading) {
      try {
        const storedCart = localStorage.getItem(`cart_${userId}`);
        const parsed = storedCart ? JSON.parse(storedCart) : { items: [] };
        console.log("Loaded cart for:", userId, parsed);
        dispatch({ type: 'INIT_CART', payload: parsed.items });
        setInitialized(true);
      } catch (error) {
        console.error("Error loading cart:", error);
        setInitialized(true);
      }
    }
  }, [userId, loading]);

  // Save cart on change (only after initialization)
  useEffect(() => {
    if (!loading && initialized) {
      try {
        localStorage.setItem(`cart_${userId}`, JSON.stringify({ items: state.items }));
        console.log("Saved cart for:", userId, state.items);
      } catch (error) {
        console.error("Error saving cart:", error);
      }
    }
  }, [state.items, userId, loading, initialized]);

  if (loading) return <div>Loading cart...</div>;

  return (
    <CartContext.Provider value={{ state, dispatch }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
};

export default CartProvider;