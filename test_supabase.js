const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = 'https://tseagsdutcihhisxyuur.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_qq98Hby7TwYNHxvUc8O3hA_Tybhi6OX';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const channel = supabase.channel('test_room', {
    config: { broadcast: { self: false } }
});

channel.subscribe((status, err) => {
    console.log('Status:', status);
    if (err) console.error('Error:', err);
    setTimeout(() => process.exit(0), 1000);
});
