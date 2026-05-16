import { supabase } from "../lib/supabaseClient";

export const getProfile = async () => {

  const { data: userData } = await supabase.auth.getUser();

  const user = userData.user;

  if (!user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error) {
    console.error(error);
    return null;
  }

  return data;

};