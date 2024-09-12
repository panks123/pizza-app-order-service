import mongoose, { AggregatePaginateModel } from "mongoose";
import aggregatePaginate from "mongoose-aggregate-paginate-v2";
import { Order, OrderStatus, PaymentMode, PaymentStatus } from './orderTypes';
import { CartItem, Topping } from '../types';

const toppingSchema = new mongoose.Schema<Topping>({
   _id: {
        type: String,
        required: true,
   },
   image: {
    type: String,
    required: true,
   },
   name: {
    type: String,
    required: true,
   },
   price: {
      type: Number,
      required: true,
   }
})

const cartSchema = new mongoose.Schema<CartItem>({
    _id: mongoose.Schema.Types.ObjectId,
    name: String,
    image: String,
    qty: Number,
    priceConfiguration: {
        type: Map,
        of: {
            priceType: { 
                type: String,
                enum: ["base" , "aditional"],
                required: true,
            },
            availableOptions: {
                type: Map,
                of: Number,
                required: true
            },
        },
        chosenConfiguration: {
            priceConfiguration: {
                type: Map,
                of: String,
                required: true
            },
            selectedToppings: {
                type: [toppingSchema],
                required: true
            }
        }
    }
});

const orderSchema = new mongoose.Schema<Order>({
    cart: {
        type: [cartSchema],
        required: true,
    },
    address: {
        type: String,
        required: true,
    },
    customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Customer",
        required: true,
    },
    total: {
        type: Number,
        required: true,
    },
    discount: {
        type: Number,
        required: true,
    },
    taxes: {
        type: Number,
        required: true,
    },
    deliveryCharges: {
        type: Number,
        required: true,
    },
    tenantId: {
        type: String,
        required: true
    },
    orderStatus: {
        type: String,
        enum: OrderStatus,
        required: true,
    },
    paymentMode: {
        type: String,
        enum: PaymentMode,
        required: true,
    },
    paymentStatus: {
        type: String,
        enum: PaymentStatus,
        required: true,
    },
    paymentId: {
        type: String,
        required: false,
        default: null,
    },
    comment: {
        type: String,
        required: false,
    },
});

orderSchema.plugin(aggregatePaginate);

export const OrderModel = mongoose.model<Order, AggregatePaginateModel<Order>>("Order", orderSchema);