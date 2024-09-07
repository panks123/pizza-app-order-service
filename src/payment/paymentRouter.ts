import express from 'express';
import { asyncWrapper } from '../utils';
import { PaymentController } from './paymentController';
import { createPaymentGateway } from '../common/factories/payment-gateway-factory';
import { createMessageBroker } from '../common/factories/broker-factory';

const router = express.Router();
// const paymentGateway = new StripePaymentGateway();
const paymentGateway = createPaymentGateway("stripe");
const broker = createMessageBroker();
const paymentController = new PaymentController(paymentGateway, broker);

router.post('/webhook', asyncWrapper(paymentController.handleWebhook));

export default router;