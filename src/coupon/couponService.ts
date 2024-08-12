import couponModel from "./couponModel";

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
}