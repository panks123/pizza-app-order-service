import { Response } from "express";
import { Request } from "express-jwt";
import { CustomerService } from "./customerService";
import { Logger } from "winston";

export class CustomerController {
    constructor(
        private customerService: CustomerService,
        private logger: Logger
    ) {}
    getCustomer = async (req: Request, res: Response) => {
        const { sub: userId, firstName, lastName, email } = req.auth;
        this.logger.info(`Getting customer with userId: ${userId}`);
        const customer = await this.customerService.getCustomer(userId, firstName, lastName, email);
        this.logger.info(`Customer with userId: ${userId} found, returning customer: ${{customer: customer._id}}`);
        res.json(customer);
    }

    addAddress = async (req: Request, res: Response) => {
        const { sub: userId } = req.auth;
        const customerId = req.params.id;
        const {address, isDefault} = req.body;
        if(!customerId) {
            this.logger.error(`Customer id not found in request`);
            res.status(400).json({error: "Customer id not found in request"});
            return;
        }

        const customer = await this.customerService.updateCustomerAddress(customerId, userId, address, isDefault);
        this.logger.info(`Customer with id: ${customerId} updated`);
        return res.json(customer);
    }
}