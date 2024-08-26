import express from 'express';
import authenticate from '../common/middleware/authenticate';
import { asyncWrapper } from '../utils';
import { OrderController } from './orderController';
import logger from '../config/logger';

const router = express.Router();

const orderController = new OrderController(logger);

router.post(
    '/',
    authenticate,
    asyncWrapper(orderController.createOrder)
)

export default router;