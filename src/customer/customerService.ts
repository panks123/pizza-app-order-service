import customerModel from "./customerModel";

export class CustomerService {
    getCustomer = async (userId: string, firstName: string, lastName: string, email: string) => {
        const customer = await customerModel.findOne({ userId});
        if(!customer) {
            const newCustomer = await customerModel.create({
                userId,
                firstName,
                lastName,
                email,
                addressess: [],
            });
            return newCustomer;
        }
        return customer;
    }
}