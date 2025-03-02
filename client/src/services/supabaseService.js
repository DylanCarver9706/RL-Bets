import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

export const subscribeToUpdates = (channel, event, callback) => {
  return supabase
    .channel(channel)
    .on('broadcast', { event }, (payload) => callback(payload))
    .subscribe();
};

export default supabase; 