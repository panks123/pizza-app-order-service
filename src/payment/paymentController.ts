import { Request, Response } from "express";
import { PaymentGateway } from "./paymentTypes";
import { OrderModel } from "../order/orderModel";
import { PaymentStatus } from "../order/orderTypes";
import { MessageBroker } from "../types/broker";

export class PaymentController {
    constructor(private paymentGateway: PaymentGateway, private broker: MessageBroker) {}
    handleWebhook = async (req: Request, res: Response) => {
        const webhookBody = req.body;
        if(req.body.type === 'checkout.session.completed') {
            const sessionId = webhookBody.data.object.id;
            const verifiedSession = await this.paymentGateway.getSession(sessionId);
            const isPaymentSuccessFul = verifiedSession.paymentStatus === "paid";
            const updatedOrder = await OrderModel.findOneAndUpdate({
                _id: verifiedSession.metadata.orderId
            }, {
                paymentStatus: isPaymentSuccessFul ? PaymentStatus.PAID : PaymentStatus.FAILED
            }, { new: true });
            // TODO - What will happen if the broker message send failed?
            await this.broker.sendMessage("order", JSON.stringify(updatedOrder));
        }
        return res.json({success: true});
    }
}