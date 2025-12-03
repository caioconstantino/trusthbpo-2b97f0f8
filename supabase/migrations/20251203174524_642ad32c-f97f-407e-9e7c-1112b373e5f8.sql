-- Create table to store Pagar.me webhooks
CREATE TABLE public.tb_webhooks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider VARCHAR NOT NULL DEFAULT 'pagarme',
  event_type VARCHAR,
  payload JSONB NOT NULL,
  processed BOOLEAN DEFAULT false,
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tb_webhooks ENABLE ROW LEVEL SECURITY;

-- Only admins can view webhooks
CREATE POLICY "Admins can view webhooks"
ON public.tb_webhooks
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow insert without auth (for webhook endpoint)
CREATE POLICY "Allow webhook inserts"
ON public.tb_webhooks
FOR INSERT
WITH CHECK (true);