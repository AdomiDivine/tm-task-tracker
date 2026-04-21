
-- ============ WIPE ALL DATA ============
DELETE FROM public.tasks;
DELETE FROM public.user_roles;
DELETE FROM public.profiles;
DELETE FROM public.projects;
DELETE FROM auth.users;

-- ============ EXTEND TASKS ============
ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS deadline timestamptz,
  ADD COLUMN IF NOT EXISTS attachments jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS completion_link text NOT NULL DEFAULT '';

-- ============ EXTEND PROJECTS ============
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS archived boolean NOT NULL DEFAULT false;

-- ============ TASK COLLABORATORS ============
CREATE TABLE IF NOT EXISTS public.task_collaborators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(task_id, user_id)
);

ALTER TABLE public.task_collaborators ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_task_collaborators_task ON public.task_collaborators(task_id);
CREATE INDEX IF NOT EXISTS idx_task_collaborators_user ON public.task_collaborators(user_id);

-- ============ HELPER: is task visible to user ============
CREATE OR REPLACE FUNCTION public.can_view_task(_task_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT
    public.has_role(_user_id, 'admin'::app_role)
    OR EXISTS (
      SELECT 1 FROM public.tasks t
      WHERE t.id = _task_id
        AND (t.assignee_id = _user_id OR t.created_by = _user_id)
    )
    OR EXISTS (
      SELECT 1 FROM public.task_collaborators c
      WHERE c.task_id = _task_id AND c.user_id = _user_id
    )
$$;

-- ============ TASKS RLS: TIGHTEN PRIVACY ============
DROP POLICY IF EXISTS "Authenticated users can view all tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can create tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can update their own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can delete their own tasks or admins can delete any" ON public.tasks;

CREATE POLICY "View own/assigned/collab tasks or admin"
  ON public.tasks FOR SELECT TO authenticated
  USING (public.can_view_task(id, auth.uid()));

CREATE POLICY "Users can create tasks"
  ON public.tasks FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Update own/assigned/collab or admin"
  ON public.tasks FOR UPDATE TO authenticated
  USING (
    auth.uid() = created_by
    OR auth.uid() = assignee_id
    OR public.has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (SELECT 1 FROM public.task_collaborators c WHERE c.task_id = tasks.id AND c.user_id = auth.uid())
  );

CREATE POLICY "Delete own or admin"
  ON public.tasks FOR DELETE TO authenticated
  USING (auth.uid() = created_by OR public.has_role(auth.uid(), 'admin'::app_role));

-- ============ PROJECTS RLS: ADMIN-ONLY MANAGE ============
DROP POLICY IF EXISTS "Admins can manage projects" ON public.projects;
DROP POLICY IF EXISTS "Projects viewable by authenticated users" ON public.projects;

CREATE POLICY "Anyone authenticated can view projects"
  ON public.projects FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins manage projects"
  ON public.projects FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- ============ TASK COLLABORATORS RLS ============
CREATE POLICY "View collaborators of visible tasks"
  ON public.task_collaborators FOR SELECT TO authenticated
  USING (public.can_view_task(task_id, auth.uid()));

CREATE POLICY "Task owner/assignee/admin manage collaborators"
  ON public.task_collaborators FOR ALL TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (SELECT 1 FROM public.tasks t WHERE t.id = task_id AND (t.created_by = auth.uid() OR t.assignee_id = auth.uid()))
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (SELECT 1 FROM public.tasks t WHERE t.id = task_id AND (t.created_by = auth.uid() OR t.assignee_id = auth.uid()))
  );

-- ============ SEED PROJECTS ============
INSERT INTO public.projects (key, name, color, icon) VALUES
  ('jaiz', 'Jaiz Bank', '#fd4f05', '🏦'),
  ('cosgrove', 'Cosgrove', '#fd4f05', '🏗️'),
  ('nis', 'NIS', '#fd4f05', '🛡️'),
  ('famly', 'Famly', '#fd4f05', '👨‍👩‍👧'),
  ('realforte', 'Realforte', '#fd4f05', '🏢'),
  ('tm', 'Takeout Media', '#fd4f05', '🎬');

-- ============ STORAGE BUCKET ============
INSERT INTO storage.buckets (id, name, public)
VALUES ('task-attachments', 'task-attachments', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read task attachments"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'task-attachments');

CREATE POLICY "Authenticated upload task attachments"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'task-attachments');

CREATE POLICY "Authenticated update own task attachments"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'task-attachments' AND owner = auth.uid());

CREATE POLICY "Authenticated delete own task attachments"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'task-attachments' AND owner = auth.uid());
