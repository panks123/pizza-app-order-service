import mongoose from "mongoose";
import { OrderModel } from "./orderModel";
import { Order, OrderEvent, PaymentMode } from "./orderTypes";
import idempotencyModel from "../idempotency/idempotencyModel";
import { PaymentGateway, PaymentSession } from "../payment/paymentTypes";
import { MessageBroker } from "../types/broker";
import { PaginateQuery } from "../types";
import { paginationLabels } from "../config/paginateLabels";
import CustomerModel from "../customer/customerModel";

export class OrderService {
  constructor(
    private paymentGateway: PaymentGateway,
    private broker: MessageBroker,
  ) {}

  // createOrder = async (idempotencyKey: string, orderDetails: Order): Promise<Order[]> => {
  createOrder = async (
    idempotencyKey: string,
    orderDetails: Order,
  ): Promise<{ orderDetails: Order; paymentSession: PaymentSession }> => {
    const idempotency = await idempotencyModel.findOne({ key: idempotencyKey });
    let newOrder = idempotency ? [idempotency.response] : [];
    if (!idempotency) {
      const session = await mongoose.startSession();
      session.startTransaction();
      try {
        newOrder = await OrderModel.create([orderDetails], { session });
        await idempotencyModel.create(
          [{ key: idempotencyKey, response: newOrder[0] }],
          { session },
        );
        // If both the cretation of order and idempotency create are successful, then commit the transaction
        await session.commitTransaction();
      } catch (err) {
        // else rollback the transaction
        await session.abortTransaction();
        throw err;
      } finally {
        session.endSession();
      }
    }
    let paymentSession: PaymentSession = null;
    if (orderDetails.paymentMode === PaymentMode.CARD) {
      paymentSession = await this.paymentGateway.createSession({
        amount: orderDetails.total,
        orderId: newOrder[0]._id.toString(),
        tenantId: orderDetails.tenantId,
        currency: "inr",
        idempotencyKey,
      });
    }

    const customer = await CustomerModel.findOne({ _id: newOrder[0].customerId });
    // Send message to kafka to update the order status
    const brokerMessage = {
      event_type: OrderEvent.ORDER_CREATE,
      data: {...newOrder[0], customerId: customer },
    };
    await this.broker.sendMessage(
      "order",
      JSON.stringify(brokerMessage),
      newOrder[0]._id.toString(),
    );

    return { orderDetails: {...newOrder[0], customerId: customer }, paymentSession };
  };

  getOrdersByCustomerId = async (
    customerId: mongoose.Types.ObjectId,
    paginateQuery: PaginateQuery,
  ) => {
    const aggregate = OrderModel.aggregate([
      {
        $match: { customerId },
      },
      {
        $project: {
          cart: 0,
        },
      },
      {
        $sort: {
          createdAt: -1,
        },
      },
    ]);

    const orders = await OrderModel.aggregatePaginate(aggregate, {
      ...paginateQuery,
      customLabels: paginationLabels,
    });

    return orders;
  };

  getOrders = async (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    matchFilters: { [key: string]: any },
    paginateQuery: PaginateQuery,
  ) => {
    const aggregate = OrderModel.aggregate([
      {
        $match: matchFilters,
      },
      {
        $lookup: {
          from: "customers",
          localField: "customerId",
          foreignField: "_id",
          as: "customerInfo",
        },
      },
      {
        $unwind: { path: "$customerInfo", preserveNullAndEmptyArrays: true },
      },
      {
        $project: {
          cart: 0,
          __v: 0,
        },
      },
      {
        $sort: {
          createdAt: -1,
        },
      },
    ]);

    const orders = await OrderModel.aggregatePaginate(aggregate, {
      ...paginateQuery,
      customLabels: paginationLabels,
    });

    return orders;
  };

  getOrderById = async (
    orderId: string,
    projection: { [key: string]: 0 | 1 },
  ) => {
    const order = await OrderModel.findOne({ _id: orderId }, projection)
      .populate("customerId", "_id firstName lastName email")
      .exec();
    return order;
  };

  findOrderByIdAndUpdate = async (orderId: string, update) => {
    const upadtedOrder = await OrderModel.findOneAndUpdate(
      { _id: orderId },
      update,
      { new: true },
    );

    const customer = await CustomerModel.findOne({ _id: upadtedOrder.customerId });

    // TODO: Send message to kafka to update the order status
    // await this.broker.sendMessage("order", JSON.stringify(upadtedOrder));
    if(update.orderStatus) { // order status being updated
      const brokerMessage = {
        event_type: OrderEvent.ORDER_STATUS_UPDATE,
        data: {...upadtedOrder.toObject(), customerId: customer},
      };

      this.broker.sendMessage(
        "order",
        JSON.stringify(brokerMessage),
        upadtedOrder._id.toString(),
      );
    }

    return {...upadtedOrder.toObject(), customerId: customer};
  };
}
