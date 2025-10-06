-- =====================================================
-- SYSTEM SETTINGS TABLE
-- =====================================================
-- Purpose: Store system-wide configuration settings
-- Author: MedCure Development Team
-- Date: October 7, 2025
-- =====================================================

-- Drop existing table if it exists (to ensure clean slate)
DROP TABLE IF EXISTS public.system_settings CASCADE;

-- Create system_settings table
CREATE TABLE public.system_settings (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    setting_key text UNIQUE NOT NULL,
    setting_value jsonb NOT NULL,
    setting_type text NOT NULL CHECK (setting_type IN ('string', 'number', 'boolean', 'json')),
    description text,
    updated_by uuid REFERENCES public.users(id),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_system_settings_key ON public.system_settings(setting_key);
CREATE INDEX IF NOT EXISTS idx_system_settings_type ON public.system_settings(setting_type);

-- Add RLS policies
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Admin can do everything
CREATE POLICY "Admins can manage system settings"
    ON public.system_settings
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
            AND users.role IN ('admin', 'super_admin')
        )
    );

-- All authenticated users can read settings
CREATE POLICY "All users can read system settings"
    ON public.system_settings
    FOR SELECT
    TO authenticated
    USING (true);

-- Create storage bucket for business assets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'business-assets',
    'business-assets',
    true,
    5242880, -- 5MB
    ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for business-assets bucket
CREATE POLICY "Admins can upload business assets"
    ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'business-assets' AND
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
            AND users.role IN ('admin', 'super_admin')
        )
    );

CREATE POLICY "Admins can update business assets"
    ON storage.objects
    FOR UPDATE
    TO authenticated
    USING (
        bucket_id = 'business-assets' AND
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
            AND users.role IN ('admin', 'super_admin')
        )
    );

CREATE POLICY "Admins can delete business assets"
    ON storage.objects
    FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'business-assets' AND
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
            AND users.role IN ('admin', 'super_admin')
        )
    );

CREATE POLICY "Everyone can view business assets"
    ON storage.objects
    FOR SELECT
    TO public
    USING (bucket_id = 'business-assets');

-- Insert default settings (logo will be stored as URL from storage bucket)
INSERT INTO public.system_settings (setting_key, setting_value, setting_type, description) VALUES
    ('business_name', to_jsonb('MedCure Pro'::text), 'string', 'Business name displayed in the application'),
    ('business_logo_url', 'null'::jsonb, 'string', 'Business logo URL from storage bucket'),
    ('currency', to_jsonb('PHP'::text), 'string', 'Default currency for the system'),
    ('tax_rate', to_jsonb('12'::text), 'string', 'Default tax rate percentage'),
    ('timezone', to_jsonb('Asia/Manila'::text), 'string', 'System timezone'),
    ('enable_notifications', to_jsonb(true), 'boolean', 'Enable system notifications'),
    ('enable_email_alerts', to_jsonb(true), 'boolean', 'Enable email alerts')
ON CONFLICT (setting_key) DO NOTHING;

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_system_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_system_settings_updated_at ON public.system_settings;
CREATE TRIGGER trigger_update_system_settings_updated_at
    BEFORE UPDATE ON public.system_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_system_settings_updated_at();

-- Add helpful comments
COMMENT ON TABLE public.system_settings IS 'Stores system-wide configuration settings';
COMMENT ON COLUMN public.system_settings.setting_key IS 'Unique identifier for the setting';
COMMENT ON COLUMN public.system_settings.setting_value IS 'JSON value of the setting';
COMMENT ON COLUMN public.system_settings.setting_type IS 'Category of the setting';

DO $$ 
BEGIN
    RAISE NOTICE '✅ System settings table created successfully';
    RAISE NOTICE '✅ Business assets storage bucket created';
    RAISE NOTICE '📁 Upload logos to: business-assets bucket';
END $$;
