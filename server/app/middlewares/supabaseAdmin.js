const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const broadcastUpdate = async (channel, event, payload) => {
  await supabase
    .channel(channel)
    .send({
      type: 'broadcast',
      event: event,
      payload: payload,
    });
};

module.exports = { supabase, broadcastUpdate }; 