import { ProductMessage } from "../types";
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
        return await productCacheModel.updateOne({
            productId: product.id,
            priceConfiguration: product.priceConfiguration,
        },
        {
            $set: {
                priceConfiguration: product.priceConfiguration,
            }
        },
        { upsert: true}
        );
    }
    return false;
}