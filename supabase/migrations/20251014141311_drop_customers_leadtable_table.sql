/*
  # Drop customers_leadtable Table

  1. Changes
    - Drop the `customers_leadtable` table completely
    - Remove all associated indexes
    - Remove all associated RLS policies
    - This table is no longer needed as Lead-Table API integration now writes directly to the Kunden table

  2. Notes
    - The Kunden table already has the necessary fields (leadtable_id, source) for Lead-Table integration
    - The get_customers_leadtable Netlify function already writes to the Kunden table
    - This migration consolidates customer data management into a single table
*/

-- Drop the customers_leadtable table (this will also drop all policies and indexes on the table)
DROP TABLE IF EXISTS customers_leadtable CASCADE;
