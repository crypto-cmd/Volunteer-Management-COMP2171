import { Event } from "../models/Event";
import { EventRepository } from "../repositories/EventRepository.ts";

export class ManageEventsService {

  constructor(
    private eventRepository: EventRepository
  ) { }

  async createEvent(
    id: string,
    name: string,
    description: string,
    date: string,
    time: string,
    location: string,
    capacity: number,
    category: string,
    status: string,
  ): Promise<void> {

    const event = new Event(
      id,
      name,
      description,
      date,
      time,
      location,
      capacity,
      category,
      status,
    );

    await this.eventRepository.create(event);

  }

  async updateEvent(event: Event): Promise<void> {

    await this.eventRepository.update(event);

  }

  async deleteEvent(eventId: string): Promise<void> {

    await this.eventRepository.delete(eventId);

  }

  getEvent(eventId: string) {

    return this.eventRepository.findById(eventId);

  }

  getAllEvents() {

    return this.eventRepository.findAll();

  }

}
