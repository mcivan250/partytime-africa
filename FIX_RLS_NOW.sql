-- FIX: Allow signup by allowing authenticated users to insert their own profile

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON users;

-- Allow anyone to view public profiles
CREATE POLICY "Public profiles are viewable by everyone" 
    ON users FOR SELECT 
    USING (true);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile" 
    ON users FOR UPDATE 
    USING (auth.uid() = id);

-- CRITICAL: Allow service role to insert new users (for signup)
CREATE POLICY "Service role can insert users" 
    ON users FOR INSERT 
    WITH CHECK (true);

-- Also allow authenticated users to insert themselves
CREATE POLICY "Users can insert own profile"
    ON users FOR INSERT
    WITH CHECK (auth.uid() = id);
