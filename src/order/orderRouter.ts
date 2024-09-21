import express from 'express';
import authenticate from '../common/middleware/authenticate';
import { asyncWrapper } from '../utils';
import { OrderController } from './orderController';
import logger from '../config/logger';
import { OrderService } from './orderService';
import { StripePaymentGateway } from '../payment/stripe';
import { createMessageBroker } from '../common/factories/broker-factory';
import { CustomerService } from '../customer/customerService';

const router = express.Router();
const paymentGateway = new StripePaymentGateway();
const broker = createMessageBroker();
const orderService = new OrderService(paymentGateway, broker);
const customerService = new CustomerService();
const orderController = new OrderController(orderService, customerService, logger);

router.post(
    '/',
    authenticate,
    asyncWrapper(orderController.createOrder)
)

router.get(
    '/',
    authenticate,
    asyncWrapper(orderController.getAll)
)

router.get(
    '/mine',
    authenticate,
    asyncWrapper(orderController.getMine)
)

router.get(
    '/:orderId',
    authenticate,
    asyncWrapper(orderController.getOrderDetails)
)

router.patch(
    '/change-status/:orderId',
    authenticate,
    asyncWrapper(orderController.changeStatus)
)

export default router;