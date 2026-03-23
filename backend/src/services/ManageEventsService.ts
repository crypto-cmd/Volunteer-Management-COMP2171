import { Event } from "../models/Event";
import { EventRepository } from "../repositories/EventRepository.ts";

export class ManageEventsService {

  constructor(
    private eventRepository: EventRepository
  ) { }

  createEvent(
    id: string,
    name: string,
    description: string,
    date: string,
    time: string,
    location: string,
    capacity: number,
    category: string,
    status: string,
  ): void {

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

    this.eventRepository.create(event);

  }

  updateEvent(event: Event): void {

    this.eventRepository.update(event);

  }

  deleteEvent(eventId: string): void {

    this.eventRepository.delete(eventId);

  }

  getEvent(eventId: string): Event | null {

    return this.eventRepository.findById(eventId);

  }

  getAllEvents(): Event[] {

    return this.eventRepository.findAll();

  }

}
