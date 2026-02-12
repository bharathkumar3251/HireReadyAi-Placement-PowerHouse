
-- Coding problems table
CREATE TABLE public.coding_problems (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'dsa',
  difficulty TEXT NOT NULL DEFAULT 'easy',
  starter_code JSONB NOT NULL DEFAULT '{}'::jsonb,
  test_cases JSONB NOT NULL DEFAULT '[]'::jsonb,
  hidden_test_cases JSONB NOT NULL DEFAULT '[]'::jsonb,
  constraints TEXT,
  hints TEXT[],
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.coding_problems ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view coding problems"
ON public.coding_problems FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins manage coding problems"
ON public.coding_problems FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Coding submissions table
CREATE TABLE public.coding_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  problem_id UUID NOT NULL REFERENCES public.coding_problems(id) ON DELETE CASCADE,
  language TEXT NOT NULL DEFAULT 'javascript',
  code TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  score INTEGER DEFAULT 0,
  test_results JSONB DEFAULT '[]'::jsonb,
  execution_time_ms INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.coding_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own submissions"
ON public.coding_submissions FOR ALL
USING (auth.uid() = user_id);

CREATE POLICY "Admins view all submissions"
ON public.coding_submissions FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Recruiters view submissions"
ON public.coding_submissions FOR SELECT
USING (has_role(auth.uid(), 'recruiter'::app_role));

-- Aptitude questions table
CREATE TABLE public.aptitude_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  question TEXT NOT NULL,
  options JSONB NOT NULL DEFAULT '[]'::jsonb,
  correct_answer INTEGER NOT NULL DEFAULT 0,
  category TEXT NOT NULL DEFAULT 'logical',
  difficulty TEXT NOT NULL DEFAULT 'medium',
  explanation TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.aptitude_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users view aptitude questions"
ON public.aptitude_questions FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins manage aptitude questions"
ON public.aptitude_questions FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Aptitude sessions table
CREATE TABLE public.aptitude_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  category TEXT NOT NULL DEFAULT 'mixed',
  total_questions INTEGER NOT NULL DEFAULT 0,
  correct_answers INTEGER NOT NULL DEFAULT 0,
  score INTEGER NOT NULL DEFAULT 0,
  time_taken_seconds INTEGER,
  answers JSONB DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'in_progress',
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.aptitude_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own aptitude sessions"
ON public.aptitude_sessions FOR ALL
USING (auth.uid() = user_id);

CREATE POLICY "Admins view all aptitude sessions"
ON public.aptitude_sessions FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Recruiters view aptitude sessions"
ON public.aptitude_sessions FOR SELECT
USING (has_role(auth.uid(), 'recruiter'::app_role));

-- Triggers for updated_at
CREATE TRIGGER update_coding_problems_updated_at
BEFORE UPDATE ON public.coding_problems
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
