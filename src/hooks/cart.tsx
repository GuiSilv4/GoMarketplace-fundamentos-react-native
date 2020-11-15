import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const storageProducts = await AsyncStorage.getItem(
        '@GoMarketplace:products',
      );
      if (storageProducts) {
        setProducts(JSON.parse(storageProducts));
      }
    }
    loadProducts();
  }, []);

  const increment = useCallback(
    async (id): Promise<boolean> => {
      const alreadyInCart = products.findIndex(item => item.id === id);

      if (alreadyInCart >= 0) {
        const newProducts = products.map((item, index) => {
          if (index === alreadyInCart) {
            const newProduct = {
              ...item,
              quantity: item.quantity + 1,
            };
            return newProduct;
          }
          return item;
        });
        setProducts(newProducts);
        await AsyncStorage.setItem(
          '@GoMarketplace:products',
          JSON.stringify(newProducts),
        );
        return true;
      }
      return false;
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      const newProducts = products
        .filter(item => {
          if (item.id !== id) return true;
          if (item.quantity === 1) return false;
          return true;
        })
        .map(item => {
          if (item.id === id && item.quantity > 0) {
            const newProduct = {
              ...item,
              quantity: item.quantity - 1,
            };
            return newProduct;
          }
          return item;
        });
      await AsyncStorage.setItem(
        '@GoMarketplace:products',
        JSON.stringify(newProducts),
      );
      setProducts(newProducts);
    },
    [products],
  );

  const addToCart = useCallback(
    async product => {
      const alreadyInCart = await increment(product.id);

      if (alreadyInCart) return;

      const newProduct = {
        ...product,
        quantity: 1,
      };
      const newProducts = [...products, newProduct];
      await AsyncStorage.setItem(
        '@GoMarketplace:products',
        JSON.stringify(newProducts),
      );
      setProducts(newProducts);
    },
    [products, increment],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
