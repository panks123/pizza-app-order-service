import { ToppingEvents, ToppingMessage } from "../types";
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
        if(topping.event_type === ToppingEvents.TOPPING_CREATE || topping.event_type === ToppingEvents.TOPPING_UPDATE) {
            return await ToppingCacheModel.updateOne({
                toppingId: topping.data.id,
            },
            {
                $set: {
                    price: topping.data.price,
                    tenantId: topping.data.tenantId,
                }
            },
            { upsert: true}
            );
        }
    }
    else {
        return await ToppingCacheModel.deleteOne({
            toppingId: topping.data.id,
        });
    }
    return false;
}