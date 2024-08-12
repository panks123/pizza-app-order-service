import express from "express";
import authenticate from "../common/middleware/authenticate";
import { asyncWrapper } from "../utils";
import { CouponController } from "./couponController";
import { CouponService } from "./couponService";
import logger from "../config/logger";
import { canAccess } from "../common/middleware/canAccess";
import { Roles } from "../common/constants";

const router = express.Router();
const couponService = new CouponService();
const couponController = new CouponController(couponService, logger);
router.post(
    "/",
    authenticate, 
    canAccess([Roles.ADMIN, Roles.MANAGER]),
    asyncWrapper(couponController.create)
);

router.post(
    "/verify",
    authenticate,
    asyncWrapper(couponController.verify)
)

export default router;
