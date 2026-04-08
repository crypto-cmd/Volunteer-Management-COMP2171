export class Badge {
    constructor(
        public readonly id: number,
        public readonly name: string,
        public readonly description: string,
        public readonly icon: string,
        public readonly createdAt: string,
    ) { }

    toJSON() {
        return {
            id: this.id,
            name: this.name,
            description: this.description,
            icon: this.icon,
            createdAt: this.createdAt,
        };
    }
}
