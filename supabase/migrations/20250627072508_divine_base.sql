/*
  # Create users table for authentication

  1. New Tables
    - `users`
      - `id` (uuid, primary key) - matches Supabase auth.users id
      - `email` (text, unique, not null)
      - `name` (text, not null)
      - `avatar_url` (text, optional)
      - `provider` (text, not null) - 'google', 'github', etc.
      - `created_at` (timestamp with timezone, default now())

  2. Security
    - Enable RLS on `users` table
    - Add policy for users to read their own data
    - Add policy for users to update their own data
*/

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  name text NOT NULL,
  avatar_url text,
  provider text NOT NULL DEFAULT 'email',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to read their own data
CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Policy to allow users to update their own data
CREATE POLICY "Users can update own data"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Policy to allow users to insert their own data (for first-time signup)
CREATE POLICY "Users can insert own data"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);