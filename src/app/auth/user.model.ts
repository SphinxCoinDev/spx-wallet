export class User {
    constructor (
        public username: string,
        public secret: string,
        public spxId: string,
        public spxKey: string,
        public spxBalance: number,
        public lastUpdate: number,
        public token: string,
        public tokenExpirationDate: Date
    ) {}

    // get token() {
    //     if (!this.tokenExpirationDate || this.tokenExpirationDate <= new Date()) {
    //       return null;
    //     }
    //     return this._token;
    // }

}

export class SyncUser {
    constructor (
        public username: string,
        public spxId: string,
        public assets: SyncAssets[]
    ) {}
}

export class SyncAssets {
    constructor (
        public asset: string,
        public key: string
    ) {}
}
