// src/components/app-sidebar.jsx
"use client";

import * as React from "react";
import Link from "next/link"; // Import Link dari Next.js

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
import { Button } from "./ui/button";
import { Plus } from "lucide-react";

// 🔥 TERIMA PROPS chatHistory
export function AppSidebar({ chatHistory = [], ...props }) {
  // Format data dari database agar sesuai dengan struktur yang dibutuhkan NavMain
  const formattedNavItems = chatHistory.map((chat) => ({
    id: chat.id,
    title: chat.title || "Chat Baru", // Fallback jika title kosong
    url: `/chat/${chat.id}`,
  }));

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
              {/* Ubah href menjadi "/" agar mengarah ke halaman mulai chat baru */}
              <Link href="/" className="w-full">
                <Button className="w-full justify-start gap-2 bg-sidebar-primary text-sidebar-primary-foreground shadow-none py-5 md:py-4 ">
                  <Plus className="size-4" />
                  <span className="font-semibold">New Chat</span>
                </Button>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {/* Masukkan data yang sudah diformat ke NavMain */}
        <NavMain items={formattedNavItems} />
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
