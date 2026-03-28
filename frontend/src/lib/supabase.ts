import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const mockChain = () => ({
  insert: async () => ({ data: null, error: null }),
  select: () => mockChain(),
  order: () => mockChain(),
  limit: () => mockChain(),
  single: async () => ({ data: null, error: null }),
  eq: () => mockChain(),
  then: async (resolve: any) => resolve({ data: [], error: null }),
});

const mockClient = {
  from: () => ({
    insert: (data: any) => {
      console.log('[Mock Supabase] Insert:', data);
      return { select: () => ({ single: async () => ({ data: null, error: null }) }) };
    },
    select: () => ({
      order: () => ({ limit: async () => ({ data: [], error: null }) }),
      limit: async () => ({ data: [], error: null }),
    }),
  }),
} as any;

export const supabase = (!supabaseUrl || !supabaseKey)
  ? mockClient
  : createClient(supabaseUrl, supabaseKey);
