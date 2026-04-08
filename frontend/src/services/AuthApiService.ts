import { requestJson } from "./api";

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
    async login(studentId: string, password: string): Promise<UserProfile> {
        return requestJson<UserProfile>("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ studentId, password }),
        });
    }

    async register(payload: RegisterPayload): Promise<UserProfile> {
        return requestJson<UserProfile>("/api/auth/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });
    }

    async getProfile(studentId: string): Promise<UserProfile> {
        return requestJson<UserProfile>(`/api/profile/${encodeURIComponent(studentId)}`);
    }

    async updateProfile(studentId: string, payload: ProfileUpdatePayload): Promise<UserProfile> {
        return requestJson<UserProfile>(`/api/profile/${encodeURIComponent(studentId)}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });
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
