import { isSupabaseConfigured, supabase } from '../lib/supabase';
import type { AdminOnboardResult, AdminOrganization } from '../types';

export const adminService = {
  async isPlatformAdmin(): Promise<boolean> {
    if (!isSupabaseConfigured || !supabase) {
      return localStorage.getItem('demo_platform_admin') === 'true';
    }

    const { data, error } = await supabase.rpc('is_platform_admin');
    if (error) {
      console.error('Failed to check platform admin status:', error);
      return false;
    }
    return Boolean(data);
  },

  async fetchAllOrganizations(): Promise<AdminOrganization[]> {
    if (!isSupabaseConfigured || !supabase) {
      return [];
    }

    const { data, error } = await supabase
      .from('organizations')
      .select(`
        id,
        name,
        slug,
        email,
        phone,
        status,
        created_at,
        restaurant_locations (
          id,
          name,
          slug,
          city,
          status
        ),
        organization_members (
          user_id,
          role,
          profiles!organization_members_user_id_fkey (
            full_name
          )
        )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map((org: any) => ({
      id: org.id,
      name: org.name,
      slug: org.slug,
      email: org.email,
      phone: org.phone,
      status: org.status,
      createdAt: org.created_at,
      locations: (org.restaurant_locations || []).map((loc: any) => ({
        id: loc.id,
        name: loc.name,
        slug: loc.slug,
        city: loc.city,
        status: loc.status
      })),
      owners: (org.organization_members || [])
        .filter((member: any) => member.role === 'owner')
        .map((member: any) => ({
          userId: member.user_id,
          fullName: member.profiles?.full_name || null,
          role: member.role
        }))
    }));
  },

  async onboardRestaurant(input: {
    orgName: string;
    orgSlug: string;
    locationName: string;
    locationSlug: string;
    city?: string;
    ownerEmail?: string;
    orgEmail?: string;
    orgPhone?: string;
  }): Promise<AdminOnboardResult> {
    if (!isSupabaseConfigured || !supabase) {
      throw new Error('Supabase is not configured.');
    }

    const { data, error } = await supabase.rpc('admin_onboard_restaurant', {
      org_name: input.orgName,
      org_slug: input.orgSlug,
      location_name: input.locationName,
      location_slug: input.locationSlug,
      city: input.city || null,
      owner_email: input.ownerEmail?.trim() || null,
      org_email: input.orgEmail?.trim() || null,
      org_phone: input.orgPhone?.trim() || null
    });

    if (error) throw error;

    const row = Array.isArray(data) ? data[0] : data;
    return {
      organizationId: row.organization_id,
      locationId: row.location_id,
      ownerUserId: row.owner_user_id,
      ownerAssigned: row.owner_assigned
    };
  },

  async assignOwner(organizationId: string, ownerEmail: string): Promise<string> {
    if (!isSupabaseConfigured || !supabase) {
      throw new Error('Supabase is not configured.');
    }

    const { data, error } = await supabase.rpc('admin_assign_owner', {
      target_org_id: organizationId,
      owner_email: ownerEmail.trim()
    });

    if (error) throw error;
    return data as string;
  }
};
