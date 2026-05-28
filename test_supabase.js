const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = 'https://ghmhqlfmxdxebcuqzior.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_btGsxzju4OTmHRV--VhglQ_NTqEEgJh';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const channel = supabase.channel('test_room', {
    config: { broadcast: { self: false } }
});

channel.subscribe((status, err) => {
    console.log('Status:', status);
    if (err) console.error('Error:', err);
    setTimeout(() => process.exit(0), 1000);
});
