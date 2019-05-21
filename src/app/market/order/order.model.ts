export class Order {
    constructor (
        public orderId: string,
        public origSymbol: string,
        public origFromAddress: string,
        public origToAddress: string,
        public origAmount: number,
        public destSymbol: string,
        public destAddress: string,
        public destAmount: number,
        public isAddress: string,
        public isAmount: number,
        public isFees: number,
        public spxFees: number,
        public orderStatus: number,
        public orderHash: string,
        public privateHash: string,
        public lastUpdate: number,
        public spxId: string
    ) {}
}
