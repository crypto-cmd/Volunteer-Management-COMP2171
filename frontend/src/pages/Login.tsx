import { type FormEvent, useState } from "react";
import { addToast } from "@components/Toast";
import { AuthApiService, type UserProfile } from "@services/AuthApiService";

const authApi = new AuthApiService();
const STUDENT_ID_REGEX = /^620\d{6}$/;

type LoginProps = {
    onLoginSuccess: (user: UserProfile) => void;
};

export default function Login({ onLoginSuccess }: LoginProps) {
    const [mode, setMode] = useState<"login" | "register">("login");
    const [studentId, setStudentId] = useState("");
    const [name, setName] = useState("");
    const [password, setPassword] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [major, setMajor] = useState("");
    const [yearOfStudy, setYearOfStudy] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const normalizedStudentId = studentId.trim();

        if (!normalizedStudentId || !password.trim()) {
            addToast({ message: "Please enter student ID and password.", type: "error" });
            return;
        }

        if (!STUDENT_ID_REGEX.test(normalizedStudentId)) {
            addToast({ message: "Student ID must follow 620XXXXXX format.", type: "error" });
            return;
        }

        setIsLoading(true);
        try {
            let user: UserProfile;

            if (mode === "login") {
                user = await authApi.login(normalizedStudentId, password);
                addToast({ message: "Welcome back!", type: "success" });
            } else {
                if (!name.trim()) {
                    addToast({ message: "Please enter your full name.", type: "error" });
                    return;
                }

                user = await authApi.register({
                    studentId: normalizedStudentId,
                    name: name.trim(),
                    password,
                    email: email.trim() || undefined,
                    phone: phone.trim() || undefined,
                    major: major.trim() || undefined,
                    yearOfStudy: yearOfStudy.trim() || undefined,
                });
                addToast({ message: "Account created successfully!", type: "success" });
            }

            onLoginSuccess(user);
        } catch (error) {
            console.error("Login failed:", error);
            addToast({ message: error instanceof Error ? error.message : "Authentication failed.", type: "error" });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
            <div className="w-full max-w-md bg-white border border-gray-200 shadow-md rounded-2xl p-8">
                <div className="mb-6 text-center">
                    <h1 className="text-2xl font-bold text-gray-800">
                        {mode === "login" ? "Volunteer Portal Login" : "Create Volunteer Account"}
                    </h1>
                    <p className="text-sm text-gray-600 mt-1">
                        {mode === "login"
                            ? "Use your student ID and password to continue."
                            : "Register a volunteer account with your student ID."}
                    </p>
                </div>

                <div className="mb-4 flex rounded-lg border border-gray-200 overflow-hidden">
                    <button
                        type="button"
                        onClick={() => setMode("login")}
                        className={`flex-1 py-2 text-sm font-medium ${mode === "login" ? "bg-blue-700 text-white" : "bg-white text-gray-700"}`}
                    >
                        Login
                    </button>
                    <button
                        type="button"
                        onClick={() => setMode("register")}
                        className={`flex-1 py-2 text-sm font-medium ${mode === "register" ? "bg-blue-700 text-white" : "bg-white text-gray-700"}`}
                    >
                        Create Account
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {mode === "register" && (
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                                Full Name
                            </label>
                            <input
                                id="name"
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full p-2.5 border rounded-lg"
                                placeholder="Your name"
                            />
                        </div>
                    )}

                    <div>
                        <label htmlFor="studentId" className="block text-sm font-medium text-gray-700 mb-1">
                            Student ID
                        </label>
                        <input
                            id="studentId"
                            type="text"
                            value={studentId}
                            onChange={(e) => setStudentId(e.target.value.replace(/\D/g, "").slice(0, 9))}
                            className="w-full p-2.5 border rounded-lg"
                            placeholder="e.g. 620164974"
                            autoComplete="username"
                            inputMode="numeric"
                            maxLength={9}
                        />
                    </div>

                    {mode === "register" && (
                        <>
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                <input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full p-2.5 border rounded-lg"
                                    placeholder="name@student.example.edu"
                                />
                            </div>
                            <div>
                                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                                <input
                                    id="phone"
                                    type="text"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    className="w-full p-2.5 border rounded-lg"
                                    placeholder="876-555-0100"
                                />
                            </div>
                            <div>
                                <label htmlFor="major" className="block text-sm font-medium text-gray-700 mb-1">Major</label>
                                <input
                                    id="major"
                                    type="text"
                                    value={major}
                                    onChange={(e) => setMajor(e.target.value)}
                                    className="w-full p-2.5 border rounded-lg"
                                />
                            </div>
                            <div>
                                <label htmlFor="yearOfStudy" className="block text-sm font-medium text-gray-700 mb-1">Year Of Study</label>
                                <input
                                    id="yearOfStudy"
                                    type="text"
                                    value={yearOfStudy}
                                    onChange={(e) => setYearOfStudy(e.target.value)}
                                    className="w-full p-2.5 border rounded-lg"
                                />
                            </div>
                        </>
                    )}

                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                            Password
                        </label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full p-2.5 border rounded-lg"
                            placeholder="Enter password"
                            autoComplete="current-password"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-blue-700 text-white py-2.5 rounded-lg font-semibold hover:bg-blue-800 transition-colors disabled:opacity-60"
                    >
                        {isLoading ? "Please wait..." : mode === "login" ? "Sign In" : "Create Account"}
                    </button>
                </form>
            </div>
        </div>
    );
}
