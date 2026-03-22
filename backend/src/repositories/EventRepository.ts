import { Event } from "../models/Event";

export interface EventRepository {

  create(event: Event): Promise<void>;

  update(event: Event): Promise<void>;

  delete(eventId: string): Promise<void>;

  findById(eventId: string): Promise<Event | null>;

  findAll(): Promise<Event[]>;

}
