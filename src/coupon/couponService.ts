import couponModel from "./couponModel";
import { Coupon } from "./couponTypes";

export class CouponService {
    create = async (title: string, code: string, validUpto: Date, discount: number, tenantId: number) => {
        const coupon = await couponModel.create({
            title,
            code,
            discount,
            validUpto,
            tenantId,
        });
        return coupon;
    }

    findByCodeAndTenant = async (code: string, tenantId: number) => {
        const coupon = await couponModel.findOne({code, tenantId});
        return coupon;
    }

    verifyExpiry = async (coupon: Coupon) => {
        const currentDate = new Date();
        if(currentDate <= coupon.validUpto) {
            return true;
        }
        return false;
    }
}