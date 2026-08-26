import { supabase } from './config/supabase';

export const fetchEnterpriseProfile = async () => {
  const { data, error } = await supabase
    .from('enterprise_profiles')
    .select('*')
    .limit(1)
    .single();

  if (error) throw error;
  return data;
};
