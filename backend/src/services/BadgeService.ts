import { BadgeRepository } from "@repositories";

export class BadgeService {
    private readonly badgeRepo: BadgeRepository;

    constructor(badgeRepo: BadgeRepository) {
        this.badgeRepo = badgeRepo;
    }

    async getBadges() {
        return this.badgeRepo.getBadges();
    }

    async createBadge(name: string, description: string, icon: string) {
        return this.badgeRepo.createBadge(name, description, icon);
    }

    async getVolunteerBadges(volunteerId: string) {
        return this.badgeRepo.getVolunteerBadges(volunteerId);
    }

    async assignBadge(volunteerId: string, badgeId: number) {
        return this.badgeRepo.assignBadge(volunteerId, badgeId);
    }
}
