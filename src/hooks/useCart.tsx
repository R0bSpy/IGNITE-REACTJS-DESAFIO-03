import { createContext, ReactNode, useContext, useState } from "react";
import { toast } from "react-toastify";
import { api } from "../services/api";
import { Product, Stock } from "../types";

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem("@RocketShoes:cart");

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const updatedCart = [...cart];

      const alreadyExists = updatedCart.find(
        (product) => product.id === productId
      );

      const { data } = await api.get(`/stock/${productId}`);
      const stockAmount = data.amount;
      const currentAmount = alreadyExists ? alreadyExists.amount : 0;
      const amount = currentAmount + 1;

      if (amount > stockAmount) {
        toast.error("Quantidade solicitada fora de estoque");
        return;
      }

      if (alreadyExists) {
        alreadyExists.amount = amount;
      } else {
        const { data } = await api.get(`/products/${productId}`);
        const newProduct = {
          ...data,
          amount: 1,
        };
        updatedCart.push(newProduct);
      }
      localStorage.setItem("@RocketShoes:cart", JSON.stringify(updatedCart));
      setCart(updatedCart);
    } catch {
      toast.error("Erro na adição do produto");
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const updatedCart = [...cart];
      const product = updatedCart.find((product) => product.id === productId);

      if (!product) {
        toast.error("Erro na remoção do produto");
        return;
      }

      const newCart = updatedCart.filter((product) => product.id !== productId);

      localStorage.setItem("@RocketShoes:cart", JSON.stringify(newCart));
      setCart(newCart);
    } catch {
      toast.error("Erro na remoção do produto");
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      const updatedCart = [...cart];
      const product = updatedCart.find((product) => product.id === productId);

      const { data } = await api.get(`/stock/${productId}`);
      const stockAmount = data.amount;

      if (amount <= 0) {
        toast.error("Quantidade solicitada fora de estoque");
        return;
      }

      if (amount > stockAmount) {
        toast.error("Quantidade solicitada fora de estoque");
        return;
      }

      product!.amount = amount;

      localStorage.setItem("@RocketShoes:cart", JSON.stringify(updatedCart));
      setCart(updatedCart);
    } catch {
      toast.error("Erro na alteração de quantidade do produto");
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
