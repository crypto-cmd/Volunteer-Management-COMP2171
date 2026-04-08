import { type ChangeEvent, type FormEvent, useEffect, useState } from "react";
import { addToast } from "@components/Toast";
import { AuthApiService, type UserProfile } from "@services/AuthApiService";

const authApi = new AuthApiService();

type ProfileProps = {
    currentUser: UserProfile;
    navigateTo: (view: string) => void;
    onProfileUpdated: (profile: UserProfile) => void;
};

export default function Profile({ currentUser, navigateTo, onProfileUpdated }: ProfileProps) {
    const [formData, setFormData] = useState<UserProfile>(currentUser);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        setFormData(currentUser);
    }, [currentUser]);

    const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSave = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSaving(true);

        try {
            const updated = await authApi.updateProfile(currentUser.studentId, {
                name: formData.name,
                email: formData.email,
                phone: formData.phone,
                major: formData.major,
                yearOfStudy: formData.yearOfStudy,
            });

            onProfileUpdated(updated);
            addToast({ message: "Profile updated successfully.", type: "success" });
        } catch (error) {
            console.error("Failed to update profile:", error);
            addToast({ message: "Failed to update profile.", type: "error" });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="p-6 max-w-4xl mx-auto font-sans">
            <div className="flex justify-between items-center mb-8 border-b pb-4">
                <button
                    onClick={() => navigateTo("home")}
                    className="flex items-center text-blue-600 hover:text-blue-800 font-medium"
                >
                    <span className="mr-2">←</span> Back to Dashboard
                </button>
            </div>

            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-800">My Profile</h1>
                <p className="text-gray-600">Manage your personal details.</p>
            </div>

            <form onSubmit={handleSave} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Student ID</label>
                        <input
                            type="text"
                            value={formData.studentId}
                            disabled
                            className="w-full p-2.5 border rounded-lg bg-gray-100 text-gray-600"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            className="w-full p-2.5 border rounded-lg"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            className="w-full p-2.5 border rounded-lg"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                        <input
                            type="text"
                            name="phone"
                            value={formData.phone}
                            onChange={handleInputChange}
                            className="w-full p-2.5 border rounded-lg"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Major</label>
                        <input
                            type="text"
                            name="major"
                            value={formData.major}
                            onChange={handleInputChange}
                            className="w-full p-2.5 border rounded-lg"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Year of Study</label>
                        <input
                            type="text"
                            name="yearOfStudy"
                            value={formData.yearOfStudy}
                            onChange={handleInputChange}
                            className="w-full p-2.5 border rounded-lg"
                        />
                    </div>
                </div>

                <div className="mt-6 flex justify-end">
                    <button
                        type="submit"
                        disabled={isSaving}
                        className="px-6 py-2.5 rounded-lg bg-blue-700 text-white font-semibold hover:bg-blue-800 transition-colors disabled:opacity-60"
                    >
                        {isSaving ? "Saving..." : "Save Changes"}
                    </button>
                </div>
            </form>
        </div>
    );
}
