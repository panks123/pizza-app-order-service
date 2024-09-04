import mongoose from "mongoose";
import { OrderModel } from "./orderModel";
import { Order, PaymentMode } from "./orderTypes";
import idempotencyModel from "../idempotency/idempotencyModel";
import { PaymentGateway, PaymentSession } from "../payment/paymentTypes";

export class OrderService {
    constructor(private paymentGateway: PaymentGateway) {}
    
    // createOrder = async (idempotencyKey: string, orderDetails: Order): Promise<Order[]> => {
    createOrder = async (idempotencyKey: string, orderDetails: Order): Promise<{orderDetails: Order, paymentSession: PaymentSession}> => {
        const idempotency = await idempotencyModel.findOne({ key: idempotencyKey });
        let newOrder = idempotency ? [idempotency.response] : [];
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
        
        if(orderDetails.paymentMode === PaymentMode.CARD) {
            const paymentSession = await this.paymentGateway.createSession({
                amount: orderDetails.total,
                orderId: newOrder[0]._id.toString(),
                tenantId: orderDetails.tenantId,
                currency: 'inr',
                idempotencyKey,
            });
    
            return {orderDetails: newOrder[0], paymentSession};
        }
        return {orderDetails: newOrder[0], paymentSession: null};
        // return newOrder;
        
    }
}