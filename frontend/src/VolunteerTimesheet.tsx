import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { VolunteerApiService, type Volunteer, type TimesheetRecord } from './services/VolunteerApiService';
import { addToast } from './Toast';

const apiService = new VolunteerApiService();

export default function VolunteerTimesheet({ navigateTo }: { navigateTo?: (view: string) => void }) {
    const [role, setRole] = useState('Volunteer'); // 'Volunteer' | 'Admin'
    const [selectedVolunteer, setSelectedVolunteer] = useState('V001');
    const [volunteerSearch, setVolunteerSearch] = useState('');
    const [searchResults, setSearchResults] = useState<Volunteer[]>([]);
    const [records, setRecords] = useState<TimesheetRecord[]>([]);
    const [volunteerName, setVolunteerName] = useState('');

    // Filtering states 
    const [eventNameFilter, setEventNameFilter] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    // Sorting states 
    const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });

    // Admin Editing state 
    const [editingId, setEditingId] = useState(null);
    const [editHours, setEditHours] = useState('');


    // Fetch records for the selected volunteer
    const fetchRecords = useCallback(async (volunteerId: string) => {
        try {
            const data = await apiService.getVolunteerRecords(volunteerId);
            setRecords(data.records);
            setVolunteerName(data.volunteer.name);
        } catch (e) {
            console.error("Failed to fetch records:", e);
            addToast({ message: "Failed to fetch records.", type: "error" });
        }
    }, []);

    // Fetch records on mount and when selected volunteer changes
    useEffect(() => {

        const id = role === 'Admin' ? selectedVolunteer : 'V001';
        fetchRecords(id);
    }, [selectedVolunteer, role, fetchRecords]);

    // Fuzzy search volunteers from backend
    useEffect(() => {
        const controller = new AbortController();
        apiService.searchVolunteers(volunteerSearch, controller.signal)
            .then(results => setSearchResults(results))
            .catch(e => { if (e.name !== 'AbortError') console.error(e); });
        return () => controller.abort();
    }, [volunteerSearch]);

    // Handle Sorting
    const requestSort = (key: string) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    // Memoized Filtering and Sorting
    const processedRecords = useMemo(() => {
        let filtered = records.filter((record) => {
            const matchName = record.eventName.toLowerCase().includes(eventNameFilter.toLowerCase());
            const matchStart = startDate ? new Date(record.date) >= new Date(startDate) : true;
            const matchEnd = endDate ? new Date(record.date) <= new Date(endDate) : true;
            return matchName && matchStart && matchEnd;
        });

        return filtered.sort((a, b) => {
            if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
            if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }, [records, eventNameFilter, startDate, endDate, sortConfig]);

    // Admin Functions
    const handleEditClick = (record: TimesheetRecord) => {
        setEditingId(record.id);
        setEditHours(String(record.hoursWorked));
    };

    const handleSaveClick = async (id: number) => {
        try {
            const updated = await apiService.updateRecord(selectedVolunteer, id, Number(editHours));
            setRecords(records.map(rec => rec.id === id ? updated : rec));
            addToast({ message: 'Record updated successfully.', type: 'success' });
        } catch (e) {
            console.error("Failed to save:", e);
            addToast({ message: 'Failed to save changes.', type: 'error' });
        }
        setEditingId(null);
    };

    return (
        <div className="p-6 max-w-5xl mx-auto font-sans">
            {/* Navigation Bar */}
            <div className="flex justify-between items-center mb-8 border-b pb-4">
                {navigateTo && (
                    <button
                        onClick={() => navigateTo('home')}
                        className="flex items-center text-blue-600 hover:text-blue-800 font-medium"
                    >
                        <span className="mr-2">←</span> Back to Dashboard
                    </button>
                )}

                {/* Role Toggle Switch */}
                <div className="flex items-center space-x-3 bg-gray-100 p-2 rounded-lg ml-auto">
                    <span className={`font-medium ${role === 'Volunteer' ? 'text-blue-600' : 'text-gray-500'}`}>Volunteer</span>
                    <button
                        onClick={() => setRole(role === 'Volunteer' ? 'Admin' : 'Volunteer')}
                        className="relative inline-flex h-6 w-11 items-center rounded-full bg-blue-600 transition-colors"
                    >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${role === 'Admin' ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                    <span className={`font-medium ${role === 'Admin' ? 'text-blue-600' : 'text-gray-500'}`}>Admin</span>
                </div>
            </div>

            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Volunteer Timesheet</h1>
                <p className="text-gray-600">Track and manage community service hours.</p>
            </div>

            {/* Admin: Volunteer Search */}
            {role === 'Admin' && (
                <div className="mb-6 bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <label className="block text-sm font-medium text-blue-800 mb-2">Select Volunteer</label>
                    <input
                        type="text"
                        placeholder="Search by name or ID..."
                        className="w-full p-2 border border-blue-300 rounded mb-2"
                        value={volunteerSearch}
                        onChange={(e) => setVolunteerSearch(e.target.value)}
                    />
                    <div className="flex flex-wrap gap-2">
                        {searchResults.map(v => (
                            <button
                                key={v.id}
                                onClick={() => { setSelectedVolunteer(v.id); setEditingId(null); }}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${selectedVolunteer === v.id
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100'
                                    }`}
                            >
                                {v.name} <span className="opacity-60">({v.id})</span>
                            </button>
                        ))}
                        {searchResults.length === 0 && (
                            <p className="text-sm text-gray-500">No volunteers found.</p>
                        )}
                    </div>
                    <p className="mt-2 text-sm text-blue-700">
                        Viewing: <strong>{volunteerName}</strong>
                    </p>
                </div>
            )}

            {/* Filters  */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 bg-gray-50 p-4 rounded-lg border">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Event</label>
                    <input
                        type="text"
                        placeholder="Search events..."
                        className="w-full p-2 border rounded"
                        value={eventNameFilter}
                        onChange={(e) => setEventNameFilter(e.target.value)}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                    <input
                        type="date"
                        className="w-full p-2 border rounded"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                    <input
                        type="date"
                        className="w-full p-2 border rounded"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                    />
                </div>
            </div>

            {/* Data Table  */}
            <div className="overflow-x-auto border rounded-lg shadow-sm">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-100 border-b">
                        <tr>
                            <th className="p-3 cursor-pointer hover:bg-gray-200" onClick={() => requestSort('date')}>
                                Date {sortConfig.key === 'date' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                            </th>
                            <th className="p-3 cursor-pointer hover:bg-gray-200" onClick={() => requestSort('eventName')}>
                                Activity / Event {sortConfig.key === 'eventName' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                            </th>
                            <th className="p-3 cursor-pointer hover:bg-gray-200" onClick={() => requestSort('hoursWorked')}>
                                Hours Worked {sortConfig.key === 'hoursWorked' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                            </th>
                            {role === 'Admin' && <th className="p-3">Actions</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {processedRecords.length > 0 ? processedRecords.map((record) => (
                            <tr key={record.id} className="border-b hover:bg-gray-50">
                                <td className="p-3">{record.date}</td>
                                <td className="p-3">{record.eventName}</td>
                                <td className="p-3">
                                    {editingId === record.id ? (
                                        <input
                                            type="number"
                                            className="w-20 p-1 border rounded"
                                            value={editHours}
                                            onChange={(e) => setEditHours(e.target.value)}
                                        />
                                    ) : (
                                        record.hoursWorked
                                    )}
                                </td>
                                {/* Admin Actions  */}
                                {role === 'Admin' && (
                                    <td className="p-3">
                                        {editingId === record.id ? (
                                            <button onClick={() => handleSaveClick(record.id)} className="text-green-600 hover:text-green-800 font-medium mr-3">Save</button>
                                        ) : (
                                            <button onClick={() => handleEditClick(record)} className="text-blue-600 hover:text-blue-800 font-medium">Edit</button>
                                        )}
                                    </td>
                                )}
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan={role === 'Admin' ? 4 : 3} className="p-6 text-center text-gray-500">
                                    No records found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                    <tfoot className="bg-gray-50 border-t font-semibold">
                        <tr>
                            <td colSpan={2} className="p-3 text-right">Total Hours:</td>
                            <td colSpan={role === 'Admin' ? 2 : 1} className="p-3">
                                {processedRecords.reduce((sum, record) => sum + Number(record.hoursWorked), 0)}
                            </td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    );
}