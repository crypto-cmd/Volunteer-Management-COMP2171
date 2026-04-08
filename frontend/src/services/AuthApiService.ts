import { API_BASE } from "./api";

export interface UserProfile {
    studentId: string;
    name: string;
    role: "Admin" | "Volunteer";
    email: string;
    phone: string;
    major: string;
    yearOfStudy: string;
}

export interface RegisterPayload {
    studentId: string;
    name: string;
    password: string;
    email?: string;
    phone?: string;
    major?: string;
    yearOfStudy?: string;
}

export interface ProfileUpdatePayload {
    name?: string;
    email?: string;
    phone?: string;
    major?: string;
    yearOfStudy?: string;
}

export class AuthApiService {
    private readonly baseUrl: string;

    constructor() {
        this.baseUrl = API_BASE;
    }

    async login(studentId: string, password: string): Promise<UserProfile> {
        const res = await fetch(`${this.baseUrl}/api/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ studentId, password }),
        });

        if (!res.ok) {
            const error = await res.json().catch(() => ({}));
            throw new Error(error.error || "Failed to login");
        }

        return res.json();
    }

    async register(payload: RegisterPayload): Promise<UserProfile> {
        const res = await fetch(`${this.baseUrl}/api/auth/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        if (!res.ok) {
            const error = await res.json().catch(() => ({}));
            throw new Error(error.error || "Failed to create account");
        }

        return res.json();
    }

    async getProfile(studentId: string): Promise<UserProfile> {
        const res = await fetch(`${this.baseUrl}/api/profile/${encodeURIComponent(studentId)}`);

        if (!res.ok) {
            const error = await res.json().catch(() => ({}));
            throw new Error(error.error || "Failed to load profile");
        }

        return res.json();
    }

    async updateProfile(studentId: string, payload: ProfileUpdatePayload): Promise<UserProfile> {
        const res = await fetch(`${this.baseUrl}/api/profile/${encodeURIComponent(studentId)}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        if (!res.ok) {
            const error = await res.json().catch(() => ({}));
            throw new Error(error.error || "Failed to update profile");
        }

        return res.json();
    }
}

const SESSION_KEY = "vm_current_user";

export function getAuthHeaders(): HeadersInit {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return {};

    try {
        const user = JSON.parse(raw) as UserProfile;
        return {
            "x-student-id": user.studentId,
            "x-user-role": user.role,
        };
    } catch {
        return {};
    }
}
