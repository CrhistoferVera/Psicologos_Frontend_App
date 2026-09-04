export type DepositStatus = 'PENDING' | 'APROVED' | 'REJECTED';

export interface DepositResponse {
    id: string;
    userId: string;
    packageId: string;
    paymentMethodId: string;
    imageUrl: string;
    status: DepositStatus;
    createdaAt: string;
}

export interface CreateDepositRequest {
    packageId: string;
    paymentMethodId: string;
}

