import mongoose from "mongoose";
import { CartItem } from "../types";

export enum PaymentMode {
    CARD = "card",
    CASH = "cash",
}

export enum OrderStatus {
    RECIEVED = "received",
    CONFIRMED = "confirmed",
    PREPARED = "prepared",
    OUT_FOR_DELIVERY = "out_for_delivery",
    DELIVERED = "delivered",
    CANCELLED = "cancelled",
}

export enum PaymentStatus {
    PENDING = "pending",
    PAID = "paid",
    FAILED = "failed",
}

export interface Order {
    cart: CartItem[];
    customerId: mongoose.Types.ObjectId;
    price: number;
    total: number;
    discount: number;
    couponCode?: string;
    taxes: number;
    deliveryCharges: number;
    address: string;
    tenantId: string;
    comment: string;
    orderStatus: OrderStatus;
    paymentMode: PaymentMode;
    paymentStatus: PaymentStatus;
    paymentId?: string;
}