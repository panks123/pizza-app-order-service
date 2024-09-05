import { Request, Response } from "express";
import { PaymentGateway } from "./paymentTypes";
import { OrderModel } from "../order/orderModel";
import { PaymentStatus } from "../order/orderTypes";

export class PaymentController {
    constructor(private paymentGateway: PaymentGateway) {}
    handleWebhook = async (req: Request, res: Response) => {
        const webhookBody = req.body;
        if(req.body.type === 'checkout.session.completed') {
            const sessionId = webhookBody.data.object.id;
            const verifiedSession = await this.paymentGateway.getSession(sessionId);
            console.log("verifiedSession:::", verifiedSession);
            const isPaymentSuccessFul = verifiedSession.paymentStatus === "paid";
            const updateOrder = await OrderModel.updateOne({
                _id: verifiedSession.metadata.orderId
            }, {
                paymentStatus: isPaymentSuccessFul ? PaymentStatus.PAID : PaymentStatus.FAILED
            }, { new: true });

            // TODO: Send Update to Kafka Broker
        }
        return res.json({success: true});
    }
}