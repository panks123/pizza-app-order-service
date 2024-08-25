import mongoose from "mongoose";
import { ProductPricingCache } from "../types";

const priceSchema = new mongoose.Schema({
    priceType: {
        type: String,
        enum: ['base', 'aditional'],
    },
    availableOptions: {
        type: Object,
        of: Number,
    }
});

const procuctCacheSchema = new mongoose.Schema<ProductPricingCache>({
    productId: {
        type: String,
        required: true,
    },
    priceConfiguration: {
        type: Object,
        of: priceSchema,
    }
});

export default mongoose.model<ProductPricingCache>('ProductPricingCache', procuctCacheSchema, 'productCache');