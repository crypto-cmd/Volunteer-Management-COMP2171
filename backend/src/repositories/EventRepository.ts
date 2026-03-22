import { Event } from "../models/Event";

export interface EventRepository {

  create(event: Event): Promise<void>;

  update(event: Event): Promise<void>;

  delete(eventId: string): Promise<void>;

  findById(eventId: string): Promise<Event | null>;

  findAll(): Promise<Event[]>;

}
export class InMemoryEventRepository implements EventRepository {
  private events: Map<string, Event> = new Map();

  async create(event: Event): Promise<void> {
    this.events.set(event.id, event);
  }

  async update(event: Event): Promise<void> {
    if (!this.events.has(event.id)) {
      throw new Error("Event not found");
    }
    this.events.set(event.id, event);
  }

  async delete(eventId: string): Promise<void> {
    this.events.delete(eventId);
  }

  async findById(eventId: string): Promise<Event | null> {
    return this.events.get(eventId) || null;
  }

  async findAll(): Promise<Event[]> {
    return Array.from(this.events.values());
  }
}
