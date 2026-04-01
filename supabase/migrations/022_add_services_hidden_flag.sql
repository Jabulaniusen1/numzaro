ALTER TABLE public.services
ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_services_is_hidden ON public.services(is_hidden);
