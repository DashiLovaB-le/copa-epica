
-- Enums
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  points INT NOT NULL DEFAULT 0,
  correct_guesses INT NOT NULL DEFAULT 0,
  incorrect_guesses INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.profiles TO anon, authenticated;
GRANT INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- user_roles
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE(user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- matches
CREATE TABLE public.matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  round_number INT NOT NULL DEFAULT 1,
  team_a TEXT NOT NULL,
  team_b TEXT NOT NULL,
  match_date TIMESTAMPTZ NOT NULL,
  result_a INT,
  result_b INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.matches TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.matches TO authenticated;
GRANT ALL ON public.matches TO service_role;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Matches are viewable by everyone" ON public.matches FOR SELECT USING (true);
CREATE POLICY "Admins can insert matches" ON public.matches FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update matches" ON public.matches FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete matches" ON public.matches FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- predictions
CREATE TABLE public.predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  predicted_a INT NOT NULL CHECK (predicted_a >= 0 AND predicted_a <= 99),
  predicted_b INT NOT NULL CHECK (predicted_b >= 0 AND predicted_b <= 99),
  points_earned INT,
  is_correct BOOLEAN,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, match_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.predictions TO authenticated;
GRANT ALL ON public.predictions TO service_role;
ALTER TABLE public.predictions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own predictions" ON public.predictions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own predictions before match" ON public.predictions FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (SELECT 1 FROM public.matches m WHERE m.id = match_id AND m.match_date > now() AND m.result_a IS NULL)
  );
CREATE POLICY "Users can update their own predictions before match" ON public.predictions FOR UPDATE TO authenticated
  USING (
    auth.uid() = user_id
    AND EXISTS (SELECT 1 FROM public.matches m WHERE m.id = match_id AND m.match_date > now() AND m.result_a IS NULL)
  );
CREATE POLICY "Users can delete their own predictions before match" ON public.predictions FOR DELETE TO authenticated
  USING (
    auth.uid() = user_id
    AND EXISTS (SELECT 1 FROM public.matches m WHERE m.id = match_id AND m.match_date > now() AND m.result_a IS NULL)
  );

-- Trigger: profile auto-create on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER matches_updated_at BEFORE UPDATE ON public.matches FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER predictions_updated_at BEFORE UPDATE ON public.predictions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Scoring trigger: when match result is set/changed, compute points for all predictions
CREATE OR REPLACE FUNCTION public.score_predictions()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  pred RECORD;
  new_points INT;
  new_correct BOOLEAN;
  old_points INT;
BEGIN
  IF NEW.result_a IS NULL OR NEW.result_b IS NULL THEN
    RETURN NEW;
  END IF;
  IF TG_OP = 'UPDATE' AND OLD.result_a IS NOT DISTINCT FROM NEW.result_a AND OLD.result_b IS NOT DISTINCT FROM NEW.result_b THEN
    RETURN NEW;
  END IF;

  FOR pred IN SELECT * FROM public.predictions WHERE match_id = NEW.id LOOP
    old_points := COALESCE(pred.points_earned, 0);

    IF pred.predicted_a = NEW.result_a AND pred.predicted_b = NEW.result_b THEN
      new_points := 10; new_correct := TRUE;
    ELSIF sign(pred.predicted_a - pred.predicted_b) = sign(NEW.result_a - NEW.result_b) THEN
      new_points := 5; new_correct := TRUE;
    ELSE
      new_points := 0; new_correct := FALSE;
    END IF;

    UPDATE public.predictions SET points_earned = new_points, is_correct = new_correct WHERE id = pred.id;

    UPDATE public.profiles
    SET points = points + (new_points - old_points),
        correct_guesses = correct_guesses + (CASE WHEN new_correct THEN 1 ELSE 0 END) - (CASE WHEN pred.is_correct IS TRUE THEN 1 ELSE 0 END),
        incorrect_guesses = incorrect_guesses + (CASE WHEN NOT new_correct THEN 1 ELSE 0 END) - (CASE WHEN pred.is_correct IS FALSE THEN 1 ELSE 0 END)
    WHERE id = pred.user_id;
  END LOOP;
  RETURN NEW;
END;
$$;
CREATE TRIGGER matches_score_predictions AFTER INSERT OR UPDATE ON public.matches FOR EACH ROW EXECUTE FUNCTION public.score_predictions();

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.matches;
ALTER PUBLICATION supabase_realtime ADD TABLE public.predictions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
