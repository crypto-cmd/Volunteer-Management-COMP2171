import React from "react";

type VolunteerOption = {
    id: string;
    name: string;
};

type VolunteerDropdownCardProps = {
    label: string;
    volunteers: VolunteerOption[];
    selectedVolunteerId: string;
    onSelectVolunteer: (id: string) => void;
    viewingName?: string;
};

export default function VolunteerDropdownCard({
    label,
    volunteers,
    selectedVolunteerId,
    onSelectVolunteer,
    viewingName,
}: VolunteerDropdownCardProps) {
    return (
        <div className="mb-6 bg-blue-50 p-4 rounded-lg border border-blue-200">
            <label className="block text-sm font-medium text-blue-800 mb-2">{label}</label>
            <select
                className="w-full p-2 border border-blue-300 rounded bg-white"
                value={selectedVolunteerId}
                onChange={(e) => onSelectVolunteer(e.target.value)}
            >
                {volunteers.map((v) => (
                    <option key={v.id} value={v.id}>
                        {v.name} ({v.id})
                    </option>
                ))}
            </select>
            {viewingName && (
                <p className="mt-2 text-sm text-blue-700">
                    Viewing: <strong>{viewingName}</strong>
                </p>
            )}
        </div>
    );
}
