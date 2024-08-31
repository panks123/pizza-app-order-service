import { OrderModel } from "./orderModel";
import { Order } from "./orderTypes";

export class OrderService {
    createOrder = async (orderDetails: Order) => {
        return await OrderModel.create(orderDetails);
    }
}