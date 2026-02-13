const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.warn('⚠️  Supabase URL or Service Key missing. Supabase functionality may be limited.');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

module.exports = supabase;
