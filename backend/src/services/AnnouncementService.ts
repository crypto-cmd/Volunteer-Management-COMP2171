import { AnnouncementRepository } from "@repositories";

export class AnnouncementService {
    private readonly announcementRepo: AnnouncementRepository;

    constructor(announcementRepo: AnnouncementRepository) {
        this.announcementRepo = announcementRepo;
    }

    async getAnnouncements() {
        return this.announcementRepo.getAnnouncements();
    }

    async createAnnouncement(title: string, message: string, postedBy: string) {
        return this.announcementRepo.createAnnouncement(title, message, postedBy);
    }
}
