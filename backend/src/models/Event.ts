export class Event {

  constructor(
    public id: string,
    public name: string,
    public description: string,
    public date: string,
    public time: string,
    public location: string,
    public capacity: number,
    public category: string,
    public status: string
  ) { }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      date: this.date,
      time: this.time,
      location: this.location,
      capacity: this.capacity,
      category: this.category,
      status: this.status,
    };
  }

}
