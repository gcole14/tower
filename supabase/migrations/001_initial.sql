-- Enable pgcrypto for gen_random_bytes
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Organizations
CREATE TABLE public.organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  twilio_account_sid text,
  twilio_auth_token text,
  twilio_phone_number text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- Profiles (linked to auth.users)
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  display_name text NOT NULL,
  role text NOT NULL CHECK (role IN ('super_admin', 'stake_admin', 'ward_admin', 'comms_chair')),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- SECURITY DEFINER function to avoid infinite recursion in profiles RLS
CREATE OR REPLACE FUNCTION public.get_my_org_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT org_id FROM public.profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- Invites
CREATE TABLE public.invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  email text NOT NULL,
  role text NOT NULL CHECK (role IN ('super_admin', 'stake_admin', 'ward_admin', 'comms_chair')),
  token text UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  accepted_at timestamptz,
  invited_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.invites ENABLE ROW LEVEL SECURITY;

-- Members
CREATE TABLE public.members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  phone text NOT NULL,
  group_tag text CHECK (group_tag IN ('elders_quorum', 'relief_society')),
  opted_out boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(org_id, phone)
);

ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;

-- Messages
CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  sent_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  body text NOT NULL,
  scope text NOT NULL CHECK (scope IN ('ward', 'elders_quorum', 'relief_society', 'stake_all')),
  recipient_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Message log
CREATE TABLE public.message_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  member_id uuid NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  phone text NOT NULL,
  status text NOT NULL,
  twilio_sid text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.message_log ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- RLS POLICIES
-- ============================================================

-- organizations: read for members of the org, all access for super_admin
CREATE POLICY "org members can view their org"
  ON public.organizations FOR SELECT
  USING (id = public.get_my_org_id());

CREATE POLICY "super_admin can view all orgs"
  ON public.organizations FOR SELECT
  USING (public.get_my_role() = 'super_admin');

CREATE POLICY "super_admin can insert orgs"
  ON public.organizations FOR INSERT
  WITH CHECK (public.get_my_role() = 'super_admin');

CREATE POLICY "super_admin can update orgs"
  ON public.organizations FOR UPDATE
  USING (public.get_my_role() = 'super_admin');

-- profiles: read own org's profiles
CREATE POLICY "org members can view profiles in their org"
  ON public.profiles FOR SELECT
  USING (org_id = public.get_my_org_id());

CREATE POLICY "users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (id = auth.uid());

CREATE POLICY "users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (id = auth.uid());

CREATE POLICY "super_admin can view all profiles"
  ON public.profiles FOR SELECT
  USING (public.get_my_role() = 'super_admin');

-- invites: scoped to org
CREATE POLICY "org admins can view invites in their org"
  ON public.invites FOR SELECT
  USING (org_id = public.get_my_org_id());

CREATE POLICY "org admins can insert invites"
  ON public.invites FOR INSERT
  WITH CHECK (org_id = public.get_my_org_id());

CREATE POLICY "org admins can delete invites"
  ON public.invites FOR DELETE
  USING (org_id = public.get_my_org_id());

CREATE POLICY "anyone can read invite by token"
  ON public.invites FOR SELECT
  USING (true);

-- members: scoped to org
CREATE POLICY "org members can view members"
  ON public.members FOR SELECT
  USING (org_id = public.get_my_org_id());

CREATE POLICY "org admins can insert members"
  ON public.members FOR INSERT
  WITH CHECK (org_id = public.get_my_org_id());

CREATE POLICY "org admins can update members"
  ON public.members FOR UPDATE
  USING (org_id = public.get_my_org_id());

CREATE POLICY "org admins can delete members"
  ON public.members FOR DELETE
  USING (org_id = public.get_my_org_id());

-- messages: read only (inserts happen via Edge Function service_role)
CREATE POLICY "org members can view messages"
  ON public.messages FOR SELECT
  USING (org_id = public.get_my_org_id());

-- message_log: read only via org scope
CREATE POLICY "org members can view message_log"
  ON public.message_log FOR SELECT
  USING (
    message_id IN (
      SELECT id FROM public.messages WHERE org_id = public.get_my_org_id()
    )
  );
