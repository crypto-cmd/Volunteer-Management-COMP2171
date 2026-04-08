export class UserProfile {
    constructor(
        public readonly studentId: string,
        public readonly name: string,
        public readonly role: "Admin" | "Volunteer",
        public readonly email: string,
        public readonly phone: string,
        public readonly major: string,
        public readonly yearOfStudy: string,
    ) { }

    toJSON() {
        return {
            studentId: this.studentId,
            name: this.name,
            role: this.role,
            email: this.email,
            phone: this.phone,
            major: this.major,
            yearOfStudy: this.yearOfStudy,
        };
    }
}