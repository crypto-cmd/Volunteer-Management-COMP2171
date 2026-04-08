export class VolunteerBadge {
    constructor(
        public readonly id: number,
        public readonly volunteerId: string,
        public readonly badgeId: number,
        public readonly awardedAt: string,
        public readonly badgeName?: string,
        public readonly badgeDescription?: string,
        public readonly badgeIcon?: string,
    ) { }

    toJSON() {
        return {
            id: this.id,
            volunteerId: this.volunteerId,
            badgeId: this.badgeId,
            awardedAt: this.awardedAt,
            badgeName: this.badgeName,
            badgeDescription: this.badgeDescription,
            badgeIcon: this.badgeIcon,
        };
    }
}
