import { NextFunction, Response } from "express";
import { Logger } from "winston";
import { CouponService } from "./couponService";
import { AuthRequest } from "../types";
import { Roles } from "../common/constants";
import createHttpError from "http-errors";

export class CouponController {
    constructor(
        private couponService: CouponService,
        private logger: Logger
    ) {}
  create = async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { title, code, validUpto, discount, tenantId } = req.body;
    const tenantIdFromToken = req.auth.tenant;
    const roleFromToken = req.auth.role;

    if(roleFromToken === Roles.MANAGER && tenantId !== tenantIdFromToken) {
        const error = createHttpError(
            403,
            "You don't have enough permissions (Invalid tenant id)",
        );
        return next(error);
    }

    const coupon = await this.couponService.create(title, code, validUpto, discount, tenantId);
    this.logger.info(`Coupon created with code: ${{couponId: coupon._id, code: coupon.code}}`);
    return res.json(coupon);
  };

  verify = async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { code, tenantId } = req.body;
    this.logger.info(`Verifying coupon with code: ${code}, tenatId: ${tenantId}`);
    const coupon = await this.couponService.findByCodeAndTenant(code, tenantId);
    if(!coupon) {
      const error = createHttpError(404, "Coupon not found");
      return next(error);
    }

    const isValid = await this.couponService.verifyExpiry(coupon);
    this.logger.info(`Coupon is valid: ${isValid}`);
    if(!isValid) {
        return res.json({
            valid: isValid,
            discount: 0,
        })
    }
    return res.json({
        valid: isValid,
        discount: coupon.discount,
    })
  }
}
