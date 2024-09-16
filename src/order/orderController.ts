import { NextFunction, Request, Response } from "express";
import { Logger } from "winston";
import { AuthRequest, CartItem, ProductPricingCache, Topping, ToppingPriceCache } from "../types";
import productCacheModel from "../product-cache/product-cache-model";
import toppingCacheModel from "../topping-cache/topping-cache-model";
import couponModel from "../coupon/couponModel";
import { OrderService } from "./orderService";
import { OrderStatus, PaymentStatus } from "./orderTypes";
import createHttpError from "http-errors";
import { CustomerService } from "../customer/customerService";
import { Roles } from "../common/constants";

export class OrderController {
    constructor(
        private orderService: OrderService,
        private customerService: CustomerService,
        private logger: Logger
    ) {}

    createOrder = async (req: Request, res: Response) => {
        // TODO: Validate request body
        const {
            cart,
            couponCode,
	        tenantId,
	        comment,
	        address,
	        customerId,
	        paymentMode,
        } = req.body;
        const totalOrderPrice = await this.calculateTotalPrice(cart);
        let discountPercentage = 0;
        if(couponCode && tenantId) {
            discountPercentage = await this.getDiscountPercentage(couponCode, tenantId);
        }
        const discountAmount = Math.round(totalOrderPrice * discountPercentage / 100);

        const priceAfterDiscount = totalOrderPrice - discountAmount;
        const taxAmount = this.getTaxAamount(priceAfterDiscount);
        const deliveryCharges = this.getDeliveryCharges();
        const finalTotal = priceAfterDiscount + taxAmount + deliveryCharges;

        const idempotencyKey = req.headers['idempotency-key'] as string;

        const serviceResponse = await this.orderService.createOrder(idempotencyKey, {
            cart,
            customerId,
            address,
            deliveryCharges,
            discount: discountAmount,
            taxes: taxAmount,
            total: finalTotal,
            paymentMode,
            comment,
            tenantId,
            orderStatus: OrderStatus.RECIEVED,
            paymentStatus: PaymentStatus.PENDING,
        });

        // Todo - Update Order document -paymentId = session.id
        if(serviceResponse.paymentSession) {
            return res.json({ paymentUrl: serviceResponse.paymentSession.paymentUrl });
        }
        return res.json({  paymentUrl: null });
    }
    
    private calculateTotalPrice = async (cart: CartItem[]): Promise<number> => {
        const productIds = cart.map(item => item._id);
        // Todo - do error handling
        const productsPricing = await productCacheModel.find({productId: {$in: productIds}});

        // Todo - What if product is not found in the cache?
        // Options: 1. Call catalog service to get product details

        const cartToppingIds = cart.reduce((acc, item) => {
            return [
                ...acc,
                ...item.chosenConfiguration.selectedToppings.map(topping => topping._id)
            ]
        }, []);

        // Todo - What if topping is not found in the cache?
        // Options: 1. Call catalog service to get topping details
        const toppingsPricing = await toppingCacheModel.find({
            toppingId: {$in: cartToppingIds}
        });

        const totalPrice = cart.reduce((acc, item) => {
            // return acc +1;
            const cachedProductPrice = productsPricing.find(product => product.productId === item._id);
            return acc + item.qty * this.getItemTotal(item, cachedProductPrice, toppingsPricing);
        }, 0);

        return totalPrice;
    }

    private getItemTotal = (item: CartItem, cachedProductPrice: ProductPricingCache, toppingsPricing: ToppingPriceCache[]): number => {
        const toppingsTotal = item.chosenConfiguration.selectedToppings.reduce((acc, topping) => {
            return acc + this.getToppingPrice(topping, toppingsPricing);
        }, 0);
        const productTotal = Object.entries(item.chosenConfiguration.priceConfiguration).reduce((acc, [key, value]) => {
            const price = cachedProductPrice.priceConfiguration[key].availableOptions[value];
            return acc + price;
        }, 0);

        return productTotal + toppingsTotal;
    }

    private getToppingPrice = (topping: Topping, toppingsPricing: ToppingPriceCache[]): number => {
        // eslint-disable-next-line
        const toppingConf = toppingsPricing.find(x_topping => x_topping.toppingId === topping._id);
        if(!toppingConf) {
            // TODO: if topping does not exist in the cache, call catalog service to get topping details
            return topping.price;
        }
    }

    private getDiscountPercentage = async (discountCode: string, tenantId: string): Promise<number> => {
        let discountPercentage = 0;
        if(discountCode && tenantId) {
            const discount = await couponModel.findOne({code:discountCode, tenantId});
            if(discount) {
                const currentDate = new Date();
                const couponExpDate = new Date(discount.validUpto);
                if(couponExpDate > currentDate) {
                    discountPercentage = Number(discount.discount); 
                }
            }

            return discountPercentage;
        }
    }

    private getTaxAamount = (price: number): number => {
        // TODO - Fetch from the tenant details (when available)
        const TAX_PERCENTAGE = 5;  // TODO: Move to server
        return Math.round(price * TAX_PERCENTAGE / 100);
    }

    private getDeliveryCharges = (): number => {
        // TODO - Fetch from the tenant details (when available)
        const DELIVERY_CHARGES = 50;  // TODO: Move to server
        return DELIVERY_CHARGES;
    }

    getMine = async (req: AuthRequest, res: Response, next: NextFunction) => {
        const { sub: userId} = req.auth;

        const {page, limit} = req.query;

        if(!userId) {
            return next(createHttpError(401, "Unauthorized"));
        }

        const customer = await this.customerService.getCustomerByUserId(userId);
        if(!customer) {
            return next(createHttpError(404, "Customer not found"));
        }

        const customerOrders = await this.orderService.getOrdersByCustomerId(
            customer._id,
            {
                page: page ? parseInt(page as string) : 1,
                limit: limit ? parseInt(limit as string) : 10,
            },
        ); 
        return res.json(customerOrders);
    }

    getAll = async (req: AuthRequest, res: Response, next: NextFunction) => {
        const { tenant: tenantId, role} = req.auth;
        const {page, limit} = req.query;
        if(role === Roles.CUSTOMER) return next(createHttpError(403, "Forbidden"));  // TODO: Merge the logic of getMine here

        if(role === Roles.ADMIN) {
            const tenantId = req.query.tenantId as string;
            const filters = {};
            if(tenantId) {
                filters["tenantId"] = tenantId;
            }
            const ordersData = await this.orderService.getOrders(filters, {
                page: page ? parseInt(page as string) : 1,
                limit: limit ? parseInt(limit as string) : 10,
            });

            return res.json(ordersData);
        }

        if(role === Roles.MANAGER) {
            const filters = {};
            if(tenantId) {
                filters["tenantId"] = tenantId;
            }
            const ordersData = await this.orderService.getOrders(filters, {
                page: page ? parseInt(page as string) : 1,
                limit: limit ? parseInt(limit as string) : 10,
            });

            return res.json(ordersData);
        }

        return next(createHttpError(403, "Forbidden"));
    }

    getOrderDetails = async (req: AuthRequest, res: Response, next: NextFunction) => {
        const { sub: userId, tenant, role} = req.auth;
        const {orderId} = req.params;
        const fields = req.query.fields ? req.query.fields.toString().split(',') : [];

        const projection = fields.reduce((acc, item) => {
            acc[item] = 1;
            return acc;
        }, {});

        const order = await this.orderService.getOrderById(orderId, {...projection, customerId: 1});
        if(!order) {
            return next(createHttpError(400, "Order does not exist"));
        }

        if(role === Roles.ADMIN) {
            return res.json(order);
        }

        else if(role === Roles.MANAGER) {
            const isMyRestaurantOrder = tenant === order.tenantId;
            if(isMyRestaurantOrder) {
                return res.json(order);
            }
            else {
                return next(createHttpError(403, "Operation Not Allowed"));
            }
        }

        else if(role === Roles.CUSTOMER) {
            const customer = await this.customerService.getCustomerByUserId(userId);
            if(!customer) {
                return next(createHttpError(400, "Customer does not exist"));
            }
            const isMyOrder = customer._id.toString() === order.customerId._id.toString();
            if(isMyOrder) {
                return res.json(order);
            }
            else {
                return next(createHttpError(400, "Order does not exist"));
            }
        }

        else {
            return next(createHttpError(403, "Operation not allowed"));
        }
    }
}
