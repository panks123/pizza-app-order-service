import { Request, Response } from "express";
import { Logger } from "winston";

export class OrderController {
    constructor(
        // private orderService: OrderService,
        private logger: Logger
    ) {}

    createOrder = async (req: Request, res: Response) => {
        return res.json({});
    }
}