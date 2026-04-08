import { type FormEvent, useEffect, useState } from "react";
import PageTopBar from "@components/PageTopBar";
import { addToast } from "@components/Toast";
import { BadgeApiService, type BadgeRecord, type VolunteerBadgeRecord } from "@services/BadgeApiService";
import { VolunteerApiService, type Volunteer } from "@services/VolunteerApiService";

const badgeApi = new BadgeApiService();
const volunteerApi = new VolunteerApiService();

type BadgesProps = {
    role: "Volunteer" | "Admin";
    currentStudentId: string;
    navigateTo?: (view: string) => void;
};

export default function Badges({ role, currentStudentId, navigateTo }: BadgesProps) {
    const [badges, setBadges] = useState<BadgeRecord[]>([]);
    const [myBadges, setMyBadges] = useState<VolunteerBadgeRecord[]>([]);
    const [volunteers, setVolunteers] = useState<Volunteer[]>([]);

    const [newBadgeName, setNewBadgeName] = useState("");
    const [newBadgeDescription, setNewBadgeDescription] = useState("");
    const [newBadgeIcon, setNewBadgeIcon] = useState("🏅");

    const [selectedVolunteerId, setSelectedVolunteerId] = useState("");
    const [selectedBadgeId, setSelectedBadgeId] = useState("");

    const loadData = async () => {
        const [allBadges, mine] = await Promise.all([
            badgeApi.getBadges(),
            badgeApi.getVolunteerBadges(currentStudentId),
        ]);
        setBadges(allBadges);
        setMyBadges(mine);

        if (role === "Admin") {
            const allVolunteers = await volunteerApi.searchVolunteers("");
            setVolunteers(allVolunteers);
            if (!selectedVolunteerId && allVolunteers.length > 0) {
                setSelectedVolunteerId(allVolunteers[0]!.id);
            }
            if (!selectedBadgeId && allBadges.length > 0) {
                setSelectedBadgeId(String(allBadges[0]!.id));
            }
        }
    };

    useEffect(() => {
        loadData().catch(() => addToast({ message: "Failed to load badges.", type: "error" }));
    }, []);

    const handleCreateBadge = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!newBadgeName.trim() || !newBadgeDescription.trim()) {
            addToast({ message: "Badge name and description are required.", type: "error" });
            return;
        }

        try {
            const created = await badgeApi.createBadge(newBadgeName.trim(), newBadgeDescription.trim(), newBadgeIcon.trim() || "🏅");
            setBadges((prev) => [...prev, created]);
            setNewBadgeName("");
            setNewBadgeDescription("");
            setNewBadgeIcon("🏅");
            addToast({ message: "Badge created.", type: "success" });
        } catch (error) {
            addToast({ message: error instanceof Error ? error.message : "Failed to create badge.", type: "error" });
        }
    };

    const handleAssignBadge = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const badgeId = Number(selectedBadgeId);
        if (!selectedVolunteerId || Number.isNaN(badgeId)) {
            addToast({ message: "Select a volunteer and badge.", type: "error" });
            return;
        }

        try {
            await badgeApi.assignBadge(selectedVolunteerId, badgeId);
            addToast({ message: "Badge assigned.", type: "success" });
            if (selectedVolunteerId === currentStudentId) {
                const mine = await badgeApi.getVolunteerBadges(currentStudentId);
                setMyBadges(mine);
            }
        } catch (error) {
            addToast({ message: error instanceof Error ? error.message : "Failed to assign badge.", type: "error" });
        }
    };

    return (
        <div className="p-6 max-w-5xl mx-auto font-sans">
            <PageTopBar role={role} navigateTo={navigateTo} />

            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Awards & Badges</h1>
                <p className="text-gray-600">Track recognition milestones and volunteer achievements.</p>
            </div>

            {role === "Admin" && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
                    <form onSubmit={handleCreateBadge} className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-3">
                        <h2 className="text-lg font-semibold text-blue-900">Create Badge</h2>
                        <input
                            type="text"
                            value={newBadgeName}
                            onChange={(e) => setNewBadgeName(e.target.value)}
                            placeholder="Badge name"
                            className="w-full p-2.5 border rounded-lg"
                        />
                        <textarea
                            value={newBadgeDescription}
                            onChange={(e) => setNewBadgeDescription(e.target.value)}
                            placeholder="Badge description"
                            className="w-full p-2.5 border rounded-lg min-h-20"
                        />
                        <input
                            type="text"
                            value={newBadgeIcon}
                            onChange={(e) => setNewBadgeIcon(e.target.value)}
                            placeholder="Icon (e.g. 🏅)"
                            className="w-full p-2.5 border rounded-lg"
                        />
                        <button className="px-4 py-2 rounded-lg bg-blue-700 text-white hover:bg-blue-800">Create Badge</button>
                    </form>

                    <form onSubmit={handleAssignBadge} className="bg-green-50 border border-green-200 rounded-xl p-4 space-y-3">
                        <h2 className="text-lg font-semibold text-green-900">Assign Badge</h2>
                        <select
                            value={selectedVolunteerId}
                            onChange={(e) => setSelectedVolunteerId(e.target.value)}
                            className="w-full p-2.5 border rounded-lg"
                        >
                            <option value="">Select volunteer</option>
                            {volunteers.map((v) => (
                                <option key={v.id} value={v.id}>{v.name} ({v.id})</option>
                            ))}
                        </select>
                        <select
                            value={selectedBadgeId}
                            onChange={(e) => setSelectedBadgeId(e.target.value)}
                            className="w-full p-2.5 border rounded-lg"
                        >
                            <option value="">Select badge</option>
                            {badges.map((b) => (
                                <option key={b.id} value={b.id}>{b.icon} {b.name}</option>
                            ))}
                        </select>
                        <button className="px-4 py-2 rounded-lg bg-green-700 text-white hover:bg-green-800">Assign Badge</button>
                    </form>
                </div>
            )}

            <h2 className="text-xl font-semibold text-gray-800 mb-3">My Badges</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {myBadges.map((badge) => (
                    <div key={badge.id} className="border border-gray-200 rounded-xl p-4 bg-white shadow-sm">
                        <div className="text-2xl">{badge.badgeIcon || "🏅"}</div>
                        <h3 className="text-lg font-semibold text-gray-800 mt-2">{badge.badgeName || `Badge #${badge.badgeId}`}</h3>
                        <p className="text-sm text-gray-600 mt-1">{badge.badgeDescription || "Achievement unlocked."}</p>
                        <p className="text-xs text-gray-500 mt-3">Awarded {new Date(badge.awardedAt).toLocaleDateString()}</p>
                    </div>
                ))}

                {myBadges.length === 0 && (
                    <div className="text-sm text-gray-500">No badges awarded yet.</div>
                )}
            </div>
        </div>
    );
}
