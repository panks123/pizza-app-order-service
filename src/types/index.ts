import { Request } from "express";

export type AuthCookie = {
  accessToken: string;
};

export interface AuthRequest extends Request {
  auth: {
    sub: string;
    role: string;
    id?: string;
    tenant: string;
  };
}

export type PriceConfiguration = {
  priceType: "base" | "aditional";
  availableOptions: {
    [key: string]: number;
  };
};

export interface ProductPricingCache {
  productId: string;
  priceConfiguration: PriceConfiguration;
}

export interface ProductMessage {
  id: string;
  priceConfiguration: PriceConfiguration;
}

export interface ToppingPriceCache {
  toppingId: string;
  price: number;
  tenantId: string;
}

export interface ToppingMessage {
  id: string;
  price: number;
  tenantId: string;
}

export type ProductPriceConfiguration = {
  [key: string] : {
      priceType: 'base' | 'aditional';
      availableOptions: {
          [key: string] : number;
      };
  }
}

export type ProductAttribute = {
  name: string;
  value: string | boolean;
}

export type Attribute = {
  name: string;
  widgetType: 'switch' | 'radio';
  defaultValue: string;
  availableOptions: string[];
}

export type Category = {
  _id: string;
  name: string;
  priceConfiguration: PriceConfiguration;
  attributes: Attribute[];
  hasToppings: boolean;
}

export type Product = {
  _id: string;
  name: string;
  image: string;
  description: string;
  categoryId: string;
  category?: Category;
  priceConfiguration: ProductPriceConfiguration;
  attributes: ProductAttribute[]
  isPublish: boolean;
  createdAt: string;
}

export type Topping =  {
  _id: string;
  name: string;
  image: string;
  price: number;
  isAvailable: boolean;
};

export interface CartItem
  extends Pick<Product, "_id" | "name" | "image" | "priceConfiguration"> {
  chosenConfiguration: {
    priceConfiguration: {
      [key: string]: string;
    };
    selectedToppings: Topping[];
  };
  qty: number;
  hash?: string;
}
