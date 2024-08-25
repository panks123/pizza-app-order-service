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
  priceType: 'base' | 'aditional';
  availableOptions: {
      [key: string]: number;
  }
}

export interface ProductPricingCache {
  productId: string;
  priceConfiguration: PriceConfiguration
}

export interface ProductMessage {
   id: string;
   priceConfiguration: PriceConfiguration
}
