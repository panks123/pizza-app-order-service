import express from 'express';
import authenticate from '../common/middleware/authenticate';
import { asyncWrapper } from '../utils';
import { OrderController } from './orderController';
import logger from '../config/logger';
import { OrderService } from './orderService';
import { StripePaymentGateway } from '../payment/stripe';
import { createMessageBroker } from '../common/factories/broker-factory';

const router = express.Router();
const paymentGateway = new StripePaymentGateway();
const broker = createMessageBroker();
const orderService = new OrderService(paymentGateway, broker);
const orderController = new OrderController(orderService, logger);

router.post(
    '/',
    authenticate,
    asyncWrapper(orderController.createOrder)
)

export default router;