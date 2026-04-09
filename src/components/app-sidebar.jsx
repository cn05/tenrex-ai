"use client";

import * as React from "react";

import { NavMain } from "@/components/nav-main";
import { SidebarOptInForm } from "@/components/sidebar-opt-in-form";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { GalleryVerticalEndIcon } from "lucide-react";
import { Button } from "./ui/button";
import { Plus } from "lucide-react";

// This is sample data.
const data = {
  navMain: [
    {
      id: "1", // Tambahkan ID untuk referensi aksi
      title: "Chat Sejarah Majapahit",
      url: "/chat/1",
    },
    {
      id: "2",
      title: "Fixing Bug Next.js",
      url: "/chat/2",
    },
  ],
};

export function AppSidebar({ ...props }) {
  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              asChild
              className="h-auto p-0 hover:bg-transparent"
            >
              <a href="#" className="w-full">
                <Button className="w-full justify-start gap-2 bg-sidebar-primary text-sidebar-primary-foreground shadow-none py-5 md:py-4 ">
                  <Plus className="size-4" />
                  <span className="font-semibold">New Chat</span>
                </Button>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <div className="p-1">
          <SidebarOptInForm />
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
