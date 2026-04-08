import { type FormEvent, useEffect, useState } from "react";
import PageTopBar from "@components/PageTopBar";
import { addToast } from "@components/Toast";
import { AnnouncementApiService, type AnnouncementRecord } from "@services/AnnouncementApiService";

const api = new AnnouncementApiService();

type AnnouncementsProps = {
    role: "Volunteer" | "Admin";
    navigateTo?: (view: string) => void;
};

export default function Announcements({ role, navigateTo }: AnnouncementsProps) {
    const [items, setItems] = useState<AnnouncementRecord[]>([]);
    const [title, setTitle] = useState("");
    const [message, setMessage] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        api.getAnnouncements()
            .then(setItems)
            .catch(() => addToast({ message: "Failed to load announcements.", type: "error" }));
    }, []);

    const handleCreate = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!title.trim() || !message.trim()) {
            addToast({ message: "Title and message are required.", type: "error" });
            return;
        }

        setIsSaving(true);
        try {
            const created = await api.createAnnouncement(title.trim(), message.trim());
            setItems((prev) => [created, ...prev]);
            setTitle("");
            setMessage("");
            addToast({ message: "Announcement posted.", type: "success" });
        } catch (error) {
            addToast({ message: error instanceof Error ? error.message : "Failed to post announcement.", type: "error" });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="p-6 max-w-5xl mx-auto font-sans">
            <PageTopBar role={role} navigateTo={navigateTo} />

            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Announcements</h1>
                <p className="text-gray-600">Stay updated with the latest volunteer news and notices.</p>
            </div>

            {role === "Admin" && (
                <form onSubmit={handleCreate} className="mb-6 bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-3">
                    <h2 className="text-lg font-semibold text-blue-900">Post New Announcement</h2>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Announcement title"
                        className="w-full p-2.5 border rounded-lg"
                    />
                    <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Announcement message"
                        className="w-full p-2.5 border rounded-lg min-h-24"
                    />
                    <button
                        type="submit"
                        disabled={isSaving}
                        className="px-4 py-2 rounded-lg bg-blue-700 text-white hover:bg-blue-800 disabled:opacity-60"
                    >
                        {isSaving ? "Posting..." : "Post Announcement"}
                    </button>
                </form>
            )}

            <div className="space-y-4">
                {items.map((item) => (
                    <div key={item.id} className="border border-gray-200 rounded-xl p-4 bg-white shadow-sm">
                        <h3 className="text-lg font-semibold text-gray-800">{item.title}</h3>
                        <p className="text-gray-700 mt-2 whitespace-pre-wrap">{item.message}</p>
                        <p className="text-xs text-gray-500 mt-3">
                            Posted {new Date(item.postedAt).toLocaleString()}
                        </p>
                    </div>
                ))}

                {items.length === 0 && (
                    <div className="text-sm text-gray-500">No announcements available.</div>
                )}
            </div>
        </div>
    );
}
