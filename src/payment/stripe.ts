import Stripe from "stripe";
import config from 'config';
import { CustomMetadata, PaymentGateway, PaymentOptions, VerifiedSession } from "./paymentTypes";

export class StripePaymentGateway implements PaymentGateway {
    private stripe: Stripe;
    constructor() {
        this.stripe = new Stripe(config.get('stripe.secretKey'));
    }
    createSession= async (options: PaymentOptions) => {
        const session = await this.stripe.checkout.sessions.create({
            // customer_email: options.customerInfo.email, // TODO: Change this - get from customrr data
            metadata: {
                orderId: options.orderId,
                tenantId: options.tenantId,
            },
            billing_address_collection: "required", // TODO: Change this,
            // payment_intent_data: { // TODO - add address info from customer data
            //     shipping: {
            //         name: "Pankaj K",
            //         address: {
            //             line1: "Address line 1",
            //             line2: "Address line 2", // Optional
            //             city: "City", // Optional
            //             state: "Maharashtra", // Optional
            //             postal_code: "411001", // Optional
            //             country: "IN" // Optional
            //         }
            //     }
            // }
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
            success_url: `${config.get('frontend.clientUI')}/payment?success=true&orderId=${options.orderId}&tenantId=${options.tenantId}`,
            cancel_url: `${config.get('frontend.clientUI')}/payment?success=false&orderId=${options.orderId}&tenantId=${options.tenantId}`,
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

    getSession= async (id: string) => {
        const session =  await this.stripe.checkout.sessions.retrieve(id);
        const verifiedSession: VerifiedSession = {
            id: session.id,
            paymentStatus: session.payment_status,
            metadata: session.metadata as unknown as CustomMetadata
        }
        return verifiedSession;
    }
}