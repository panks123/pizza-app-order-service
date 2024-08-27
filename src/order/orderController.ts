import { Request, Response } from "express";
import { Logger } from "winston";
import { CartItem, ProductPricingCache, Topping, ToppingPriceCache } from "../types";
import productCacheModel from "../product-cache/product-cache-model";
import toppingCacheModel from "../topping-cache/topping-cache-model";

export class OrderController {
    constructor(
        // private orderService: OrderService,
        private logger: Logger
    ) {}

    createOrder = async (req: Request, res: Response) => {
        // TODO: Validate request body
        const totalOrderPrice = await this.calculateTotalPrice(req.body.cart);
        return res.json({totalOrderPrice});
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
}