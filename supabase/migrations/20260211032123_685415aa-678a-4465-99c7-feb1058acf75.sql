
-- Table for recruiter decisions on candidates (shortlist/reject/select)
CREATE TABLE public.candidate_decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recruiter_id UUID NOT NULL,
  student_user_id UUID NOT NULL,
  decision TEXT NOT NULL CHECK (decision IN ('shortlisted', 'rejected', 'selected')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(recruiter_id, student_user_id)
);

ALTER TABLE public.candidate_decisions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Recruiters manage own decisions" ON public.candidate_decisions
  FOR ALL USING (auth.uid() = recruiter_id);

CREATE POLICY "Admins view all decisions" ON public.candidate_decisions
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_candidate_decisions_updated_at
  BEFORE UPDATE ON public.candidate_decisions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
