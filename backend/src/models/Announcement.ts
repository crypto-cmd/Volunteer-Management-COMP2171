export class Announcement {
    constructor(
        public readonly id: number,
        public readonly title: string,
        public readonly message: string,
        public readonly postedAt: string,
        public readonly postedBy: string,
    ) { }

    toJSON() {
        return {
            id: this.id,
            title: this.title,
            message: this.message,
            postedAt: this.postedAt,
            postedBy: this.postedBy,
        };
    }
}
