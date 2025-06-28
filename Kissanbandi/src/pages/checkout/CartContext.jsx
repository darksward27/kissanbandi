import React, { createContext, useContext, useReducer, useEffect, useState } from 'react';
import  {useAuth}  from './AuthProvider';
const CartContext = createContext();

const cartReducer = (state, action) => {
  switch (action.type) {
    case 'ADD_TO_CART':
       console.log("Adding to cart:", action.payload);
      const existingItem = state.items.find(item => item.id === action.payload.id);
      if (existingItem) {
        return {
          ...state,
          items: state.items.map(item =>
            item.id === action.payload.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          ),
        };
      }
      return {
        ...state,
        items: [...state.items, { ...action.payload, quantity: 1 }],
      };

    case 'INIT_CART':
      return {
        ...state,
        items: action.payload,
      };

    case 'REMOVE_FROM_CART':
      return {
        ...state,
        items: state.items.filter(item => item.id !== action.payload),
      };

    case 'UPDATE_QUANTITY':
      return {
        ...state,
        items: state.items.map(item =>
          item.id === action.payload.id
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
  // Re-initialize cart when userId changes

  // ✅ Load cart when auth or userId changes
  useEffect(() => {
    if (!loading) {
      try {
        const storedCart = localStorage.getItem(`cart_${userId}`);
        const parsed = storedCart ? JSON.parse(storedCart) : { items: [] };
        console.log("Loaded cart for:", userId, parsed);
        dispatch({ type: 'INIT_CART', payload: parsed.items });
      } catch (error) {
        console.error("Error loading cart:", error);
      }
    }
  }, [userId, loading]);

  // ✅ Save cart on change
  useEffect(() => {
    if (!loading) {
      try {
        localStorage.setItem(`cart_${userId}`, JSON.stringify({ items: state.items }));
        console.log("Saved cart for:", userId, state.items);
      } catch (error) {
        console.error("Error saving cart:", error);
      }
    }
  }, [state.items, userId, loading]);

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
