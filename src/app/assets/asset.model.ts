export class Asset {
    constructor (
        public symbol: string,
        public name: string,
        public algo: string,
        public logoUrl: string,
        public publicKey: string,
        public privateKey: string,
        public balance: number,
        public balanceUSD: number,
        public balanceBTC: number,
        public lastUpdate: number
    ) {}
}


export class RemoteAsset {
    symbol: string;
    name: string;
    algo: string;
    rpc: string;
    chainId: number;
}
