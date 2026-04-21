
-- 1. Add team_lead to enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'team_lead';

-- 2. Promote Innocent to admin
UPDATE public.user_roles SET role = 'admin' WHERE user_id = '81fc02ee-d623-49c0-934c-6c74011dc38d';

-- 3. project_members table
CREATE TABLE IF NOT EXISTS public.project_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  is_lead boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (project_id, user_id)
);
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view project members"
  ON public.project_members FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins manage project members"
  ON public.project_members FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 4. Helper function
CREATE OR REPLACE FUNCTION public.is_project_lead(_user_id uuid, _project_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.project_members
    WHERE user_id = _user_id AND project_id = _project_id AND is_lead = true
  )
$$;

-- 5. Update task RLS to include team leads
DROP POLICY IF EXISTS "Update own/assigned/collab or admin" ON public.tasks;
CREATE POLICY "Update own/assigned/collab/lead or admin"
  ON public.tasks FOR UPDATE TO authenticated
  USING (
    auth.uid() = created_by
    OR auth.uid() = assignee_id
    OR public.has_role(auth.uid(), 'admin')
    OR public.is_project_lead(auth.uid(), project_id)
    OR EXISTS (SELECT 1 FROM public.task_collaborators c WHERE c.task_id = tasks.id AND c.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Delete own or admin" ON public.tasks;
CREATE POLICY "Delete own/lead or admin"
  ON public.tasks FOR DELETE TO authenticated
  USING (
    auth.uid() = created_by
    OR public.has_role(auth.uid(), 'admin')
    OR public.is_project_lead(auth.uid(), project_id)
  );

-- Update can_view_task to include team leads
CREATE OR REPLACE FUNCTION public.can_view_task(_task_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT
    public.has_role(_user_id, 'admin'::app_role)
    OR EXISTS (
      SELECT 1 FROM public.tasks t
      WHERE t.id = _task_id
        AND (
          t.assignee_id = _user_id
          OR t.created_by = _user_id
          OR public.is_project_lead(_user_id, t.project_id)
        )
    )
    OR EXISTS (
      SELECT 1 FROM public.task_collaborators c
      WHERE c.task_id = _task_id AND c.user_id = _user_id
    )
$$;

-- 6. Allow team leads to update their projects (not create/archive)
DROP POLICY IF EXISTS "Admins manage projects" ON public.projects;
CREATE POLICY "Admins full manage projects"
  ON public.projects FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Team leads can update their projects"
  ON public.projects FOR UPDATE TO authenticated
  USING (public.is_project_lead(auth.uid(), id));

-- 7. Notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  actor_id uuid,
  type text NOT NULL DEFAULT 'assignment',
  title text NOT NULL,
  body text NOT NULL DEFAULT '',
  task_id uuid REFERENCES public.tasks(id) ON DELETE CASCADE,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS notifications_user_idx ON public.notifications(user_id, created_at DESC);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view their notifications"
  ON public.notifications FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users update own notifications"
  ON public.notifications FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can create notifications"
  ON public.notifications FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = actor_id OR auth.uid() = user_id);

ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER TABLE public.notifications REPLICA IDENTITY FULL;

-- 8. Email log (mock email history)
CREATE TABLE IF NOT EXISTS public.email_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_email text NOT NULL,
  recipient_user_id uuid,
  subject text NOT NULL,
  body text NOT NULL,
  task_id uuid,
  status text NOT NULL DEFAULT 'mock_sent',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.email_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins view email log"
  ON public.email_log FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Authenticated insert email log"
  ON public.email_log FOR INSERT TO authenticated
  WITH CHECK (true);
