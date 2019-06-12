export class User {
    constructor (
        public username: string,
        public secret: string,
        public spxId: string,
        public spxKey: string,
        public spxBalance: number,
        public pgpPhrase: string,
        public pgpPubKey: string,
        public pgpPrivKey: string,
        public token: string,
        public tokenExpirationDate: Date,
        public lastUpdate: number
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
        public pgpKey: string,
        public assets: SyncAssets[]
    ) {}
}

export class SyncAssets {
    constructor (
        public asset: string,
        public key: string
    ) {}
}
