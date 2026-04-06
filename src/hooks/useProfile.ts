import { useQuery } from '@tanstack/react-query'
import type { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import type { Role } from '@/types'

export interface Profile {
  id: string
  org_id: string
  display_name: string
  role: Role
  organization: {
    id: string
    name: string
    twilio_phone_number: string | null
  } | null
}

export function useProfile(user: User | null) {
  return useQuery<Profile | null>({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user) return null

      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          org_id,
          display_name,
          role,
          organizations (
            id,
            name,
            twilio_phone_number
          )
        `)
        .eq('id', user.id)
        .single()

      if (error) throw error

      return {
        id: data.id,
        org_id: data.org_id,
        display_name: data.display_name,
        role: data.role as Role,
        organization: Array.isArray(data.organizations)
          ? data.organizations[0] ?? null
          : (data.organizations as Profile['organization']),
      }
    },
    enabled: !!user,
  })
}
