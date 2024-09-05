import { PaymentGateway } from "../../payment/paymentTypes";
import { StripePaymentGateway } from "../../payment/stripe";

let paymentGateway: PaymentGateway | null = null;

export const createPaymentGateway = (pgName: string): PaymentGateway => {
    // singleton
    if(!paymentGateway) {
        switch(pgName) {
            case "stripe":
                paymentGateway = new StripePaymentGateway();
                break;
            default:
                paymentGateway = new StripePaymentGateway(); // We have currently only stripe payment gateway
        }
    }
    return paymentGateway;
}