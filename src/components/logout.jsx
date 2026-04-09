"use client";

import { createClient } from "@/lib/client";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export function LogoutButton() {
  const supabase = createClient();
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <Button variant="destructive" onClick={handleLogout}>
      Log Out
    </Button>
  );
}
