import { Event } from "../models/Event";
import { EventRepository } from "../repositories/EventRepository";

export class ManageEventsService {

  constructor(
    private eventRepository: EventRepository
  ) {}

  async createEvent(
    id: string,
    title: string,
    description: string,
    date: Date,
    location: string
  ): Promise<void> {

    const event = new Event(
      id,
      title,
      description,
      date,
      location
    );

    await this.eventRepository.create(event);

  }

  async updateEvent(event: Event): Promise<void> {

    await this.eventRepository.update(event);

  }

  async deleteEvent(eventId: string): Promise<void> {

    await this.eventRepository.delete(eventId);

  }

  async getEvent(eventId: string): Promise<Event | null> {

    return await this.eventRepository.findById(eventId);

  }

  async getAllEvents(): Promise<Event[]> {

    return await this.eventRepository.findAll();

  }

}
