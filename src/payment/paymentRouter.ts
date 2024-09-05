import express from 'express';
import { asyncWrapper } from '../utils';
import { PaymentController } from './paymentController';
import { createPaymentGateway } from '../common/factories/payment-gateway-factory';

const router = express.Router();
// const paymentGateway = new StripePaymentGateway();
const paymentGateway = createPaymentGateway("stripe");
const paymentController = new PaymentController(paymentGateway);

router.post('/webhook', asyncWrapper(paymentController.handleWebhook));

export default router;