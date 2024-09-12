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

    updateCustomerAddress = async (customerId: string, userId: string, address: string, isDefault: boolean = false) => {
        const customer = await customerModel.findOneAndUpdate({_id: customerId, userId}, {
            $push: {addresses: {text: address, isDefault}}
        }, {new: true});
        return customer;
    }

    getCustomerByUserId = async (userId: string) => {
        const customer = await customerModel.findOne({userId});
        return customer;
    }
}