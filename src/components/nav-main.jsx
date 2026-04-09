"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuAction, // Tambahkan ini
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";

export function NavMain({ items }) {
  const { isMobile } = useSidebar();

  return (
    <SidebarGroup>
      <SidebarMenu>
        {items.map((item) => (
          <SidebarMenuItem key={item.title}>
            {/* Link Utama: Untuk pindah chat */}
            <SidebarMenuButton asChild>
              <a href={item.url}>
                <span>{item.title}</span>
              </a>
            </SidebarMenuButton>

            {/* Tombol Titik Tiga: Terpisah di pojok kanan */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuAction showOnHover>
                  <MoreHorizontal />
                  <span className="sr-only">More</span>
                </SidebarMenuAction>
              </DropdownMenuTrigger>

              <DropdownMenuContent
                side={isMobile ? "bottom" : "right"}
                align={isMobile ? "end" : "start"}
                className="min-w-48 rounded-lg"
              >
                <DropdownMenuItem
                  onClick={() => console.log("Rename", item.title)}
                >
                  <Pencil className="mr-2 size-4 text-muted-foreground" />
                  <span>Rename</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => console.log("Delete", item.title)}
                >
                  <Trash2 className="mr-2 size-4 text-destructive" />
                  <span className="text-destructive">Delete</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
