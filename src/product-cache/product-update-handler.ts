import { ProductEvents, ProductMessage } from "../types";
import productCacheModel from "./product-cache-model";

export const handleProductUpdate = async (value: string) => {
    let product: ProductMessage | null = null;
    try {
        product = JSON.parse(value);
    }
    catch (e) {
        console.log("JSON parse Error", e);
        return false;
    }
    if(product) {
        if(product.event_type === ProductEvents.PRODUCT_CREATE || product.event_type === ProductEvents.PRODUCT_UPDATE) {
            return await productCacheModel.updateOne({
                productId: product.data.id,
                priceConfiguration: product.data.priceConfiguration,
            },
            {
                $set: {
                    priceConfiguration: product.data.priceConfiguration,
                }
            },
            { upsert: true}
            );
        }
        else {
            return await productCacheModel.deleteOne({
                productId: product.data.id,
            });
        }
    }
    return false;
}