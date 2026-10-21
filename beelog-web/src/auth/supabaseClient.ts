// import { createClient } from "@supabase/supabase-js";

// const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
// const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();





// //Comment out later
// // console.log("Supabase env check:", {
// //   urlPresent: Boolean(supabaseUrl),
// //   keyPresent: Boolean(supabaseAnonKey),
// // });
// //Comment out later



// export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

// export const supabase = isSupabaseConfigured
//   ? createClient(supabaseUrl!, supabaseAnonKey!, {
//       auth: {
//         autoRefreshToken: true,
//         detectSessionInUrl: true,
//         persistSession: true,
//       },
//     })
//   : null;



import { createClient } from "@supabase/supabase-js";

console.log("Vite env diagnostic:", {
  mode: import.meta.env.MODE,
  urlPresent: Boolean(import.meta.env.VITE_SUPABASE_URL),
  keyPresent: Boolean(import.meta.env.VITE_SUPABASE_ANON_KEY),
});

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!, {
      auth: {
        autoRefreshToken: true,
        detectSessionInUrl: true,
        persistSession: true,
      },
    })
  : null;