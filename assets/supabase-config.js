window.SUPABASE_URL = 'https://dsokhfvtwidcuckqkdxb.supabase.co';
window.SUPABASE_KEY = 'sb_publishable_aF11Da2IvCuJHohSL4OHsg_TQYcm8Jk';
window.getSupabase = function () {
  if (!window._sb) {
    window._sb = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_KEY);
  }
  return window._sb;
};
