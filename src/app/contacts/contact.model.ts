export class Contact {
    constructor (
        public username: string,
        public spxId: string,
        public lastUpdate: number,
        public assets: [
            {
                asset: string,
                key: string
            }
        ]
    ) {}
}
