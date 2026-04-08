import type { RouteContext, RouteMap } from "./types";

export function createAuthRoutes(ctx: RouteContext): RouteMap {
    return {
        "/api/auth/login": {
            async POST(req: Request) {
                const body = await req.json() as { studentId?: string; password?: string };
                const studentId = body.studentId?.trim() || "";

                if (!studentId || !body.password) {
                    return ctx.json({ error: "studentId and password are required" }, 400);
                }

                if (!ctx.isValidStudentId(studentId)) {
                    return ctx.json({ error: "studentId must follow 620XXXXXX format" }, 400);
                }

                try {
                    const user = await ctx.volunteerService.login(studentId, body.password);
                    if (!user) return ctx.json({ error: "Invalid credentials" }, 401);
                    return ctx.json(user);
                } catch (e: any) {
                    return ctx.json({ error: e.message }, 400);
                }
            },
        },

        "/api/auth/register": {
            async POST(req: Request) {
                const body = await req.json() as {
                    studentId?: string;
                    name?: string;
                    password?: string;
                    email?: string;
                    phone?: string;
                    major?: string;
                    yearOfStudy?: string;
                };

                const studentId = body.studentId?.trim() || "";
                const name = body.name?.trim() || "";
                const password = body.password || "";

                if (!studentId || !name || !password) {
                    return ctx.json({ error: "studentId, name and password are required" }, 400);
                }

                if (!ctx.isValidStudentId(studentId)) {
                    return ctx.json({ error: "studentId must follow 620XXXXXX format" }, 400);
                }

                if (password.length < 6) {
                    return ctx.json({ error: "Password must be at least 6 characters" }, 400);
                }

                try {
                    const created = await ctx.volunteerService.registerVolunteer({
                        studentId,
                        name,
                        password,
                        email: body.email?.trim(),
                        phone: body.phone?.trim(),
                        major: body.major?.trim(),
                        yearOfStudy: body.yearOfStudy?.trim(),
                        role: "volunteer",
                    });
                    return ctx.json(created, 201);
                } catch (e: any) {
                    return ctx.json({ error: e.message }, 400);
                }
            },
        },
    };
}
