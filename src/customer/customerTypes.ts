export interface Address {
    text: string;
    isDefault: boolean;
}

export interface Customer {
    userId: string;
    firstName: string;
    lastName: string;
    email: string;
    addressess: Address[];
    createdAt: Date;
    updatedAt: Date;
}