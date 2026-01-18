-- Migration: Cleanup Services Table
-- Removes all stale services and allows fresh sync from API

-- Step 1: Drop the foreign key constraint temporarily
-- Find and drop all foreign key constraints referencing services table
DO $$
DECLARE
    constraint_record RECORD;
BEGIN
    -- Find all foreign key constraints that reference services table
    FOR constraint_record IN
        SELECT conname, conrelid::regclass::text as table_name
        FROM pg_constraint
        WHERE contype = 'f'
          AND confrelid = 'public.services'::regclass
    LOOP
        -- Drop each constraint found
        EXECUTE format('ALTER TABLE %I DROP CONSTRAINT %I', 
            constraint_record.table_name, 
            constraint_record.conname);
        RAISE NOTICE 'Dropped constraint % from table %', 
            constraint_record.conname, 
            constraint_record.table_name;
    END LOOP;
END $$;

-- Step 2: Make service_id nullable temporarily so we can clear it from orders
ALTER TABLE public.orders 
ALTER COLUMN service_id DROP NOT NULL;

-- Step 3: Clear service_id from all orders (we'll need to update them after services are repopulated)
UPDATE public.orders 
SET service_id = NULL;

-- Step 4: Delete all services data (this will reset the sequence)
-- Using CASCADE to handle any remaining references
TRUNCATE TABLE public.services RESTART IDENTITY CASCADE;

-- Step 5: Recreate the foreign key constraint (nullable for now)
ALTER TABLE public.orders 
ADD CONSTRAINT orders_service_id_fkey 
FOREIGN KEY (service_id) 
REFERENCES public.services(id) 
ON DELETE RESTRICT;

-- Note: The services table will be repopulated automatically 
-- when users visit /api/services endpoint, which syncs from the API
-- 
-- IMPORTANT: After running this migration, you may want to:
-- 1. Visit /api/services to sync services from the API
-- 2. Update existing orders to reference valid services if needed
--    (or leave them as NULL if you don't need historical service references)

