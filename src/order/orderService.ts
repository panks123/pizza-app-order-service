import mongoose from "mongoose";
import { OrderModel } from "./orderModel";
import { Order } from "./orderTypes";
import idempotencyModel from "../idempotency/idempotencyModel";

export class OrderService {
    createOrder = async (idempotencyKey: string, orderDetails: Order): Promise<Order[]> => {
        const idempotency = await idempotencyModel.findOne({ key: idempotencyKey });
        let newOrder: Order[] = idempotency ? [idempotency.response] : [];
        if(!idempotency) {
            const session = await mongoose.startSession();
            session.startTransaction(); 
            try {
                newOrder = await OrderModel.create([orderDetails], { session });
                await idempotencyModel.create([{ key: idempotencyKey, response: newOrder[0] }], { session });
                // If both the cretation of order and idempotency create are successful, then commit the transaction
                await session.commitTransaction();
            }
            catch(err) {
                // else rollback the transaction
                await session.abortTransaction();
                throw err;
            }
            finally {
                session.endSession();
            }
        }

        return newOrder;
        
    }
}