import express from "express";
import { asyncWrapper } from "../utils";
import { CustomerController } from "./customerController";
import authenticate from "../common/middleware/authenticate";
import logger from "../config/logger";
import { CustomerService } from "./customerService";

const router = express.Router();
const customerService = new CustomerService();
const customerController = new CustomerController(customerService, logger);

router.get("/", authenticate, asyncWrapper(customerController.getCustomer));
router.patch("/addresses/:id", authenticate, asyncWrapper(customerController.addAddress));

export default router;