'use client';

import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';

export interface CartModifier {
  id: string;
  nameAr: string;
  nameEn: string;
  priceDeltaMinor: number;
}

export interface CartItem {
  productId: string;
  sizeId: string;
  nameAr: string;
  nameEn: string;
  sizeNameAr: string;
  sizeNameEn: string;
  priceMinor: number;
  quantity: number;
  modifiers: CartModifier[];
  imageUrl?: string | null;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  updateQuantity: (index: number, quantity: number) => void;
  removeItem: (index: number) => void;
  clearCart: () => void;
  itemCount: number;
  subtotalMinor: number;
  locale: 'ar' | 'en';
  setLocale: (locale: 'ar' | 'en') => void;
  toggleLocale: () => void;
}

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [locale, setLocaleState] = useState<'ar' | 'en'>('ar');
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem('cairo_cart');
      const savedLocale = localStorage.getItem('cairo_locale') as 'ar' | 'en' | null;

      queueMicrotask(() => {
        if (savedCart) {
          try {
            setItems(JSON.parse(savedCart));
          } catch {
            // Ignore parse errors
          }
        }
        if (savedLocale && (savedLocale === 'ar' || savedLocale === 'en')) {
          setLocaleState(savedLocale);
        }
        setIsLoaded(true);
      });
    } catch {
      queueMicrotask(() => {
        setIsLoaded(true);
      });
    }
  }, []);

  // Save items to localStorage
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('cairo_cart', JSON.stringify(items));
    }
  }, [items, isLoaded]);

  const setLocale = (newLocale: 'ar' | 'en') => {
    setLocaleState(newLocale);
    localStorage.setItem('cairo_locale', newLocale);
  };

  const toggleLocale = () => {
    const next = locale === 'ar' ? 'en' : 'ar';
    setLocale(next);
  };

  const addItem = (newItem: CartItem) => {
    setItems((prev) => {
      // Find if same product, same size, and exact same modifiers already in cart
      const existingIndex = prev.findIndex(
        (i) =>
          i.productId === newItem.productId &&
          i.sizeId === newItem.sizeId &&
          JSON.stringify(i.modifiers.map((m) => m.id).sort()) ===
            JSON.stringify(newItem.modifiers.map((m) => m.id).sort())
      );

      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex].quantity += newItem.quantity;
        return updated;
      }

      return [...prev, newItem];
    });
  };

  const updateQuantity = (index: number, quantity: number) => {
    if (quantity <= 0) {
      removeItem(index);
      return;
    }
    setItems((prev) => {
      const updated = [...prev];
      if (updated[index]) {
        updated[index] = { ...updated[index], quantity };
      }
      return updated;
    });
  };

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const clearCart = () => {
    setItems([]);
  };

  const itemCount = useMemo(() => {
    return items.reduce((sum, item) => sum + item.quantity, 0);
  }, [items]);

  const subtotalMinor = useMemo(() => {
    return items.reduce((sum, item) => {
      const modTotal = item.modifiers.reduce((mSum, m) => mSum + m.priceDeltaMinor, 0);
      return sum + (item.priceMinor + modTotal) * item.quantity;
    }, 0);
  }, [items]);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        updateQuantity,
        removeItem,
        clearCart,
        itemCount,
        subtotalMinor,
        locale,
        setLocale,
        toggleLocale,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
