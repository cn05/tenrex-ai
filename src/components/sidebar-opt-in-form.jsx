import { Card, CardContent } from "@/components/ui/card";

import { NavUser } from "./nav-user";

const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
};

export function SidebarOptInForm() {
  return (
    <Card className="gap-2 py-4 shadow-none">
      <CardContent className="px-4">
        <div className="grid gap-2.5">
          <NavUser />
        </div>
      </CardContent>
    </Card>
  );
}
