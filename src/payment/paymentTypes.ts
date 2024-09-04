export interface PaymentOptions {
    currency?: 'inr'; // currently only inr is supported
    amount: number;
    orderId: string;
    tenantId: string;
    idempotencyKey?: string;
}

type GateWayPaymentStatus = "no_payment_required" | "paid" | "unpaid";

export interface PaymentSession { 
    id: string;
    paymentUrl: string;
    paymentStatus: GateWayPaymentStatus;
}

interface CustomMetadata {
    orderId: string;

}

interface VerifiedSession {
    id: string;
    metadata: CustomMetadata;
    paymentStatus: GateWayPaymentStatus;
}

export interface PaymentGateway {
    createSession: (options: PaymentOptions) => Promise<PaymentSession>;
    getSession: (id: string) => Promise<VerifiedSession>;
}