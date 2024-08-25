import { ToppingMessage } from "../types";
import ToppingCacheModel from "./topping-cache-model";

export const handleToppingUpdate = async (value: string) => {
    let topping: ToppingMessage | null = null;
    try {
        topping = JSON.parse(value);
    }
    catch (e) {
        console.log("JSON parse Error", e);
        return false;
    }
    if(topping) {
        return await ToppingCacheModel.updateOne({
            toppingId: topping.id,
        },
        {
            $set: {
                price: topping.price,
                tenantId: topping.tenantId,
            }
        },
        { upsert: true}
        );
    }
    return false;
}