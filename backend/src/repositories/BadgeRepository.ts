import { SupabaseClient } from "@supabase/supabase-js";
import { Badge, VolunteerBadge } from "@models";

function relationBadge(
    relation: { name: string; description: string; icon: string } | { name: string; description: string; icon: string }[] | null | undefined
): { name?: string; description?: string; icon?: string } {
    if (!relation) return {};
    const value = Array.isArray(relation) ? relation[0] : relation;
    if (!value) return {};
    return { name: value.name, description: value.description, icon: value.icon };
}

export class BadgeRepository {
    private supabase: SupabaseClient;

    constructor(supabaseClient: SupabaseClient) {
        this.supabase = supabaseClient;
    }

    async getBadges(): Promise<Badge[]> {
        const { data, error } = await this.supabase
            .from("badges")
            .select("*")
            .order("name", { ascending: true });

        if (error) throw new Error(`Failed to fetch badges: ${error.message}`);

        return data.map((b) => new Badge(
            b.id,
            b.name,
            b.description,
            b.icon,
            b.created_at
        ));
    }

    async createBadge(name: string, description: string, icon: string): Promise<Badge> {
        const { data, error } = await this.supabase
            .from("badges")
            .insert({ name, description, icon })
            .select("*")
            .single();

        if (error) {
            if (error.code === "23505") throw new Error("Badge already exists");
            throw new Error(`Failed to create badge: ${error.message}`);
        }

        return new Badge(
            data.id,
            data.name,
            data.description,
            data.icon,
            data.created_at
        );
    }

    async getVolunteerBadges(volunteerId: string): Promise<VolunteerBadge[]> {
        const { data, error } = await this.supabase
            .from("volunteer_badges")
            .select(`
                id,
                volunteer_id,
                badge_id,
                awarded_at,
                badges (name, description, icon)
            `)
            .eq("volunteer_id", volunteerId)
            .order("awarded_at", { ascending: false });

        if (error) throw new Error(`Failed to fetch volunteer badges: ${error.message}`);

        return data.map((vb) => {
            const badge = relationBadge(vb.badges);
            return new VolunteerBadge(
                vb.id,
                vb.volunteer_id,
                vb.badge_id,
                vb.awarded_at,
                badge.name,
                badge.description,
                badge.icon
            );
        });
    }

    async assignBadge(volunteerId: string, badgeId: number): Promise<VolunteerBadge> {
        const { data, error } = await this.supabase
            .from("volunteer_badges")
            .insert({
                volunteer_id: volunteerId,
                badge_id: badgeId,
            })
            .select(`
                id,
                volunteer_id,
                badge_id,
                awarded_at,
                badges (name, description, icon)
            `)
            .single();

        if (error) {
            if (error.code === "23505") throw new Error("Badge already assigned to this volunteer");
            throw new Error(`Failed to assign badge: ${error.message}`);
        }

        const badge = relationBadge(data.badges);
        return new VolunteerBadge(
            data.id,
            data.volunteer_id,
            data.badge_id,
            data.awarded_at,
            badge.name,
            badge.description,
            badge.icon
        );
    }
}
