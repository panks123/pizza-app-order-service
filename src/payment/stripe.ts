import Stripe from "stripe";
import config from 'config';
import { PaymentGateway, PaymentOptions } from "./paymentTypes";

export class StripePaymentGateway implements PaymentGateway {
    private stripe: Stripe;
    constructor() {
        this.stripe = new Stripe(config.get('stripe.secretKey'));
    }
    createSession= async (options: PaymentOptions) => {
        const session = await this.stripe.checkout.sessions.create({
            metadata: {
                orderId: options.orderId,
            },
            line_items: [
                {
                    price_data: {
                        unit_amount: options.amount * 100, // Convert to rupee,
                        product_data: {
                            name: "Online Pizza Order",
                            description: "Total amount to be paid",
                            images: [
                                "https://placehold.co/600x400" // TODO: Change this
                            ],
                        },
                        currency: options.currency || "inr",
                    },
                    quantity: 1,
                }
            ],
            mode: 'payment',
            success_url: `${config.get('frontend.clientUI')}/payment/success=true&orderId=${options.orderId}`,
            cancel_url: `${config.get('frontend.clientUI')}/payment/success=false&orderId=${options.orderId}`,
        }, {
            idempotencyKey: options.idempotencyKey,
        });
        return {
            id: session.id,
            paymentUrl: session.url,
            paymentStatus: session.payment_status
        }
        return null;
    }

    getSession= async () => {
        return null;
    }
}