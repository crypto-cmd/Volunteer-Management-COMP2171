import React, { useEffect, useMemo, useState } from "react";
import DataTable, { type DataTableColumn, type DataTableRow } from "@components/DataTable";
import Modal from "@components/Modal";
import PageTopBar from "@components/PageTopBar";
import { addToast } from "@components/Toast";
import {
    EventApiService,
    type EventPayload,
    type EventRecord,
    type EventRequestRecord,
    type EventRequestStatus,
} from "@services/EventApiService";
import { VolunteerApiService, type Volunteer } from "@services/VolunteerApiService";

const eventApi = new EventApiService();
const volunteerApi = new VolunteerApiService();

type EventsProps = {
    navigateTo?: (view: string) => void;
    currentStudentId?: string;
};

function toForm(event?: EventRecord): EventRecord {
    if (event) return { ...event };

    return {
        id: "",
        name: "",
        date: "",
        time: "",
        location: "",
        description: "",
        capacity: 1,
        category: "Community Service",
        status: "Draft",
    };
}

export default function Events({ navigateTo, role = "Volunteer", currentStudentId }: EventsProps & { role?: "Volunteer" | "Admin" }) {
    const [events, setEvents] = useState<EventRecord[]>([]);
    const [requests, setRequests] = useState<EventRequestRecord[]>([]);
    const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
    const [selectedVolunteerId, setSelectedVolunteerId] = useState("");

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState<EventRecord>(toForm());
    const [capacityInput, setCapacityInput] = useState("1");
    const [isSaving, setIsSaving] = useState(false);

    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [sortConfig, setSortConfig] = useState<{ key: "name" | "date" | "category" | "capacity" | "status"; direction: "asc" | "desc" }>({
        key: "date",
        direction: "desc",
    });

    const fetchEvents = async () => {
        const data = await eventApi.getEvents();
        setEvents(data);
    };

    const fetchRequests = async () => {
        const data = await eventApi.getEventRequests();
        setRequests(data);
    };

    useEffect(() => {
        Promise.all([fetchEvents(), fetchRequests(), volunteerApi.searchVolunteers("")])
            .then(([, , foundVolunteers]) => {
                setVolunteers(foundVolunteers);
                // For volunteers, lock to their own ID; for admins, use first volunteer
                if (role === "Volunteer" && currentStudentId) {
                    setSelectedVolunteerId(currentStudentId);
                } else if (foundVolunteers.length > 0 && !foundVolunteers.some((v) => v.id === selectedVolunteerId)) {
                    setSelectedVolunteerId(foundVolunteers[0]!.id);
                }
            })
            .catch((e) => {
                console.error("Failed to initialize events page:", e);
                addToast({ message: "Failed to load events data.", type: "error" });
            });
    }, []);

    const handleInputChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;
        if (name === "capacity") {
            setCapacityInput(value.replace(/\D/g, ""));
            return;
        }
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleCreateNew = () => {
        setFormData(toForm());
        setCapacityInput("1");
        setIsModalOpen(true);
    };

    const handleEdit = (event: EventRecord) => {
        setFormData(toForm(event));
        setCapacityInput(String(event.capacity));
        setIsModalOpen(true);
    };

    const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSaving(true);

        const parsedCapacity = Number(capacityInput);
        if (!capacityInput || !Number.isInteger(parsedCapacity) || parsedCapacity < 1) {
            addToast({ message: "Required Volunteers must be a whole number greater than 0.", type: "error" });
            setIsSaving(false);
            return;
        }

        const payload: EventPayload = {
            name: formData.name,
            date: formData.date,
            time: formData.time,
            location: formData.location,
            description: formData.description,
            capacity: parsedCapacity,
            category: formData.category,
            status: formData.status,
        };

        try {
            const existing = Boolean(formData.id) && events.some((ev) => ev && ev.id === formData.id);
            if (existing) {
                const updated = await eventApi.updateEvent(formData.id, payload);
                setEvents((prev) => prev.map((ev) => (ev && ev.id === updated.id ? updated : ev)));
                addToast({ message: "Activity updated.", type: "success" });
            } else {
                const created = await eventApi.createEvent(payload);
                setEvents((prev) => [...prev, created]);
                addToast({ message: "Activity created.", type: "success" });
            }
            setIsModalOpen(false);
        } catch (err) {
            console.error("Failed to save event:", err);
            addToast({ message: "Failed to save activity.", type: "error" });
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        const confirmFirst = window.confirm(
            "Are you sure you want to delete this event? This action will impact registered volunteers."
        );
        if (!confirmFirst) return;

        const confirmSecond = window.confirm("Please confirm again. This deletion is permanent.");
        if (!confirmSecond) return;

        try {
            await eventApi.deleteEvent(id);
            setEvents((prev) => prev.filter((ev) => ev.id !== id));
            addToast({ message: "Activity deleted.", type: "success" });
        } catch (err) {
            console.error("Failed to delete event:", err);
            addToast({ message: "Failed to delete activity.", type: "error" });
        }
    };

    const handleRequestParticipation = async (eventId: string) => {
        try {
            const created = await eventApi.requestEventParticipation(eventId, selectedVolunteerId);
            setRequests((prev) => [created, ...prev]);
            addToast({ message: "Request submitted for admin review.", type: "success" });
        } catch (err) {
            console.error("Failed to request participation:", err);
            addToast({ message: "Unable to submit request.", type: "error" });
        }
    };

    const handleRequestDecision = async (requestId: number, status: EventRequestStatus) => {
        try {
            const updated = await eventApi.updateEventRequestStatus(requestId, status);
            setRequests((prev) => prev.map((r) => (r.id === requestId ? updated : r)));
            addToast({ message: `Request ${status.toLowerCase()}.`, type: "success" });
        } catch (err) {
            console.error("Failed to update request status:", err);
            addToast({ message: "Failed to update request.", type: "error" });
        }
    };

    const filteredEvents = useMemo(() => {
        const roleVisible = role === "Volunteer" ? events.filter((ev) => ev && ev.status !== "Draft") : events;

        const filtered = roleVisible.filter((ev) => {
            if (!ev) return false;
            const matchName = ev.name.toLowerCase().includes(searchTerm.toLowerCase());
            const matchStatus = statusFilter ? ev.status === statusFilter : true;
            return matchName && matchStatus;
        });

        return [...filtered].sort((a, b) => {
            let comparison = 0;

            if (sortConfig.key === "capacity") {
                comparison = a.capacity - b.capacity;
            } else if (sortConfig.key === "date") {
                comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
            } else {
                const left = String(a[sortConfig.key]).toLowerCase();
                const right = String(b[sortConfig.key]).toLowerCase();
                comparison = left.localeCompare(right);
            }

            return sortConfig.direction === "asc" ? comparison : -comparison;
        });
    }, [events, role, searchTerm, statusFilter, sortConfig]);

    const requestSort = (key: "name" | "date" | "category" | "capacity" | "status") => {
        let direction: "asc" | "desc" = "asc";
        if (sortConfig.key === key && sortConfig.direction === "asc") {
            direction = "desc";
        }
        setSortConfig({ key, direction });
    };

    const requestByEventForSelectedVolunteer = useMemo(() => {
        const map = new Map<string, EventRequestRecord>();
        requests
            .filter((r) => r.volunteerId === selectedVolunteerId)
            .sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime())
            .forEach((r) => {
                if (!map.has(r.eventId)) map.set(r.eventId, r);
            });
        return map;
    }, [requests, selectedVolunteerId]);

    const pendingRequests = useMemo(() => requests.filter((r) => r.status === "Pending"), [requests]);

    const acceptedCountByEvent = useMemo(() => {
        const map = new Map<string, number>();
        requests.forEach((r) => {
            if (r.status === "Accepted") {
                map.set(r.eventId, (map.get(r.eventId) || 0) + 1);
            }
        });
        return map;
    }, [requests]);

    const eventById = useMemo(() => {
        const map = new Map<string, EventRecord>();
        events.forEach((event) => {
            if (event && event.id) {
                map.set(event.id, event);
            }
        });
        return map;
    }, [events]);

    const statusClass = (status: string) => {
        if (status === "Published") return "bg-green-100 text-green-800";
        if (status === "Draft") return "bg-gray-200 text-gray-800";
        if (status === "Completed") return "bg-blue-100 text-blue-800";
        if (status === "Cancelled") return "bg-red-100 text-red-800";
        return "bg-yellow-100 text-yellow-800";
    };

    const pendingColumns: DataTableColumn[] = [
        { key: "volunteer", header: "Volunteer", headerClassName: "p-3" },
        { key: "activity", header: "Activity", headerClassName: "p-3" },
        { key: "requestedAt", header: "Requested At", headerClassName: "p-3" },
        { key: "actions", header: "Actions", headerClassName: "p-3 text-right" },
    ];

    const pendingRows: DataTableRow[] = pendingRequests.map((req) => ({


        key: req.id,
        cells: [
            req.volunteerName || req.volunteerId,
            req.eventName || req.eventId,
            new Date(req.requestedAt).toLocaleString(),
            <div className="text-right space-x-3" key={`actions-${req.id}`}>
                {(() => {
                    const event = eventById.get(req.eventId);
                    const acceptedCount = acceptedCountByEvent.get(req.eventId) || 0;
                    const isFull = event ? acceptedCount >= event.capacity : false;

                    if (isFull) {
                        return (
                            <span className="inline-block px-2 py-1 text-xs rounded-full font-medium bg-red-100 text-red-700">
                                Full - increase capacity
                            </span>
                        );
                    }

                    return (
                        <>
                            <button
                                onClick={() => handleRequestDecision(req.id, "Accepted")}
                                className="text-green-700 hover:text-green-900 font-medium text-sm"
                            >
                                Accept
                            </button>
                            <button
                                onClick={() => handleRequestDecision(req.id, "Declined")}
                                className="text-red-700 hover:text-red-900 font-medium text-sm"
                            >
                                Decline
                            </button>
                        </>
                    );
                })()}
            </div>,
        ],
        rowClassName: "border-b",
    }));

    const eventColumns: DataTableColumn[] = [
        {
            key: "name",
            header: (
                <button className="w-full text-left" onClick={() => requestSort("name")}>
                    Activity Name {sortConfig.key === "name" && (sortConfig.direction === "asc" ? "↑" : "↓")}
                </button>
            ),
            headerClassName: "p-3 cursor-pointer hover:bg-gray-200",
        },
        {
            key: "dateTime",
            header: (
                <button className="w-full text-left" onClick={() => requestSort("date")}>
                    Date & Time {sortConfig.key === "date" && (sortConfig.direction === "asc" ? "↑" : "↓")}
                </button>
            ),
            headerClassName: "p-3 cursor-pointer hover:bg-gray-200",
        },
        {
            key: "category",
            header: (
                <button className="w-full text-left" onClick={() => requestSort("category")}>
                    Category {sortConfig.key === "category" && (sortConfig.direction === "asc" ? "↑" : "↓")}
                </button>
            ),
            headerClassName: "p-3 cursor-pointer hover:bg-gray-200",
        },
        {
            key: "capacity",
            header: (
                <button className="w-full text-left" onClick={() => requestSort("capacity")}>
                    {role === "Admin" ? "Accepted / Capacity" : "Capacity"} {sortConfig.key === "capacity" && (sortConfig.direction === "asc" ? "↑" : "↓")}
                </button>
            ),
            headerClassName: "p-3 cursor-pointer hover:bg-gray-200",
        },
        {
            key: "status",
            header: (
                <button className="w-full text-left" onClick={() => requestSort("status")}>
                    Status {sortConfig.key === "status" && (sortConfig.direction === "asc" ? "↑" : "↓")}
                </button>
            ),
            headerClassName: "p-3 cursor-pointer hover:bg-gray-200",
        },
        { key: "actions", header: "Actions", headerClassName: "p-3 text-right" },
    ];

    const eventRows: DataTableRow[] = filteredEvents.map((ev) => {
        const volunteerRequest = requestByEventForSelectedVolunteer.get(ev.id);
        const canVolunteerRequest = ev.status === "Published" || ev.status === "Ongoing";

        return {
            key: ev.id,
            cells: [
                <span className="font-medium text-gray-800" key={`name-${ev.id}`}>{ev.name}</span>,
                <span className="text-sm" key={`date-${ev.id}`}>{ev.date} at {ev.time}</span>,
                <span className="text-sm text-gray-600" key={`cat-${ev.id}`}>{ev.category}</span>,
                role === "Admin"
                    ? `${acceptedCountByEvent.get(ev.id) || 0} / ${ev.capacity}`
                    : ev.capacity,
                <span
                    key={`status-${ev.id}`}
                    className={`px-2 py-1 text-xs rounded-full font-medium ${statusClass(ev.status)}`}
                >
                    {ev.status}
                </span>,
                role === "Admin" ? (
                    <div className="text-right space-x-3" key={`admin-actions-${ev.id}`}>
                        <button
                            onClick={() => handleEdit(ev)}
                            className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                        >
                            Edit
                        </button>
                        <button
                            onClick={() => handleDelete(ev.id)}
                            className="text-red-600 hover:text-red-800 font-medium text-sm"
                        >
                            Delete
                        </button>
                    </div>
                ) : (
                    <div className="text-right" key={`vol-actions-${ev.id}`}>
                        {!volunteerRequest && canVolunteerRequest && (
                            <button
                                onClick={() => handleRequestParticipation(ev.id)}
                                className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                            >
                                Request to Attend
                            </button>
                        )}
                        {!volunteerRequest && !canVolunteerRequest && (
                            <span className="inline-block px-2 py-1 text-xs rounded-full font-medium bg-gray-200 text-gray-700">
                                Requests Closed
                            </span>
                        )}
                        {volunteerRequest && (
                            <span
                                className={`inline-block px-2 py-1 text-xs rounded-full font-medium ${volunteerRequest.status === "Accepted"
                                    ? "bg-green-100 text-green-800"
                                    : volunteerRequest.status === "Declined"
                                        ? "bg-red-100 text-red-800"
                                        : "bg-yellow-100 text-yellow-800"
                                    }`}
                            >
                                Request {volunteerRequest.status}
                            </span>
                        )}
                    </div>
                ),
            ],
        };
    });

    return (
        <div className="p-6 max-w-6xl mx-auto font-sans relative">
            <PageTopBar
                role={role}
                navigateTo={navigateTo}
            />

            <div className="flex justify-between items-end mb-6 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Manage Activities & Events</h1>
                    <p className="text-gray-600">
                        {role === "Volunteer"
                            ? "Request to join published or ongoing events."
                            : "Create events and process participation requests."}
                    </p>
                </div>



                {role === "Admin" && (
                    <button
                        onClick={handleCreateNew}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded shadow font-medium"
                    >
                        + Create New Activity
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 bg-gray-50 p-4 rounded-lg border">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Search Activities</label>
                    <input
                        type="text"
                        placeholder="Search by name..."
                        className="w-full p-2 border rounded"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Status</label>
                    <select
                        className="w-full p-2 border rounded bg-white"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="">All Statuses</option>
                        {role === "Admin" && <option value="Draft">Draft</option>}
                        <option value="Published">Published</option>
                        <option value="Ongoing">Ongoing</option>
                        <option value="Completed">Completed</option>
                        <option value="Cancelled">Cancelled</option>
                    </select>
                </div>
            </div>

            {role === "Admin" && (
                <div className="mb-6">
                    <div className="bg-amber-50 border rounded-t-lg border-b-0 p-3 font-semibold text-amber-800">
                        Pending Volunteer Requests
                    </div>
                    <DataTable
                        columns={pendingColumns}
                        rows={pendingRows}
                        emptyMessage="No pending requests."
                        emptyColSpan={4}
                        wrapperClassName="overflow-x-auto border rounded-b-lg shadow-sm"
                        maxVisibleRows={5}
                    />
                </div>
            )}

            <DataTable
                columns={eventColumns}
                rows={eventRows}
                emptyMessage="No activities found."
                emptyColSpan={6}
                maxVisibleRows={8}
            />

            <Modal
                isOpen={isModalOpen}
                title={events.some((ev) => ev.id === formData.id) ? "Edit Activity" : "Create New Activity"}
                onClose={() => setIsModalOpen(false)}
            >
                <form onSubmit={handleSave} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Activity Name (Max 100 chars) *</label>
                        <input
                            required
                            type="text"
                            name="name"
                            maxLength={100}
                            value={formData.name}
                            onChange={handleInputChange}
                            className="w-full p-2 border rounded"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Date *</label>
                            <input
                                required
                                type="date"
                                name="date"
                                value={formData.date}
                                onChange={handleInputChange}
                                className="w-full p-2 border rounded"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Time *</label>
                            <input
                                required
                                type="time"
                                name="time"
                                value={formData.time}
                                onChange={handleInputChange}
                                className="w-full p-2 border rounded"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Location (Max 200 chars) *</label>
                        <input
                            required
                            type="text"
                            name="location"
                            maxLength={200}
                            value={formData.location}
                            onChange={handleInputChange}
                            className="w-full p-2 border rounded"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Required Volunteers *</label>
                            <input
                                required
                                type="text"
                                inputMode="numeric"
                                name="capacity"
                                placeholder="e.g. 25"
                                value={capacityInput}
                                onChange={handleInputChange}
                                className="w-full p-2 border rounded"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Category *</label>
                            <select
                                required
                                name="category"
                                value={formData.category}
                                onChange={handleInputChange}
                                className="w-full p-2 border rounded bg-white"
                            >
                                <option value="Environmental">Environmental</option>
                                <option value="Community Service">Community Service</option>
                                <option value="Fundraising">Fundraising</option>
                                <option value="Educational">Educational</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Status</label>
                        <select
                            name="status"
                            value={formData.status}
                            onChange={handleInputChange}
                            className="w-full p-2 border rounded bg-white"
                        >
                            <option value="Draft">Draft</option>
                            <option value="Published">Published</option>
                            <option value="Ongoing">Ongoing</option>
                            <option value="Completed">Completed</option>
                            <option value="Cancelled">Cancelled</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Description (Max 1000 chars) *</label>
                        <textarea
                            required
                            name="description"
                            maxLength={1000}
                            rows={4}
                            value={formData.description}
                            onChange={handleInputChange}
                            className="w-full p-2 border rounded"
                        ></textarea>
                    </div>

                    <div className="flex justify-end space-x-3 mt-6 border-t pt-4">
                        <button
                            type="button"
                            onClick={() => setIsModalOpen(false)}
                            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
                            disabled={isSaving}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded shadow disabled:opacity-50"
                            disabled={isSaving}
                        >
                            {isSaving ? "Saving..." : "Save Activity"}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
