"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/client";

// Import komponen dari shadcn/ui
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

// 🔥 TAMBAH: Import Alert Dialog untuk konfirmasi hapus
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";

export function NavMain({ items = [] }) {
  const { isMobile } = useSidebar();
  const router = useRouter();
  const params = useParams();
  const supabase = createClient();

  // State untuk Rename
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // 🔥 TAMBAH: State untuk Delete Modal (Menyimpan objek chat yang mau dihapus)
  const [chatToDelete, setChatToDelete] = useState(null);

  // --- Fungsi Rename ---
  const handleRenameStart = (item) => {
    setEditingId(item.id);
    setEditTitle(item.title);
  };

  const handleRenameSave = async (id) => {
    if (!editTitle.trim()) {
      setEditingId(null);
      return;
    }
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from("chats")
        .update({ title: editTitle })
        .eq("id", id);
      if (error) throw error;
      setEditingId(null);
      router.refresh();
    } catch (error) {
      console.error("Gagal rename:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e, id) => {
    if (e.key === "Enter") handleRenameSave(id);
    if (e.key === "Escape") setEditingId(null);
  };

  // --- 🔥 UPDATE: Fungsi Delete (Dipanggil dari dalam Modal) ---
  const confirmDelete = async () => {
    if (!chatToDelete) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from("chats")
        .delete()
        .eq("id", chatToDelete.id);
      if (error) throw error;

      router.refresh();

      // Tendang ke halaman utama jika chat yang dihapus sedang dibuka
      if (params.id === chatToDelete.id) {
        router.push("/");
      }
    } catch (error) {
      console.error("Gagal menghapus:", error);
    } finally {
      setIsLoading(false);
      setChatToDelete(null); // Tutup modal setelah selesai
    }
  };

  return (
    <>
      <SidebarGroup>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.id}>
              {editingId === item.id ? (
                // --- MODE EDIT NAMA ---
                <div className="flex items-center w-full gap-2 px-2 py-1.5">
                  <input
                    autoFocus
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, item.id)}
                    onBlur={() => handleRenameSave(item.id)}
                    disabled={isLoading}
                    className="flex-1 bg-background border rounded px-2 py-1 text-sm outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              ) : (
                // --- MODE NORMAL ---
                <>
                  <SidebarMenuButton asChild isActive={params.id === item.id}>
                    <Link href={item.url}>
                      <span className="truncate">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>

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
                        onClick={() => handleRenameStart(item)}
                        disabled={isLoading}
                      >
                        <Pencil className="mr-2 size-4 text-muted-foreground" />
                        <span>Rename</span>
                      </DropdownMenuItem>

                      {/* 🔥 UPDATE: Ubah onClick agar membuka modal, bukan langsung delete */}
                      <DropdownMenuItem
                        onClick={() => setChatToDelete(item)}
                        disabled={isLoading}
                      >
                        <Trash2 className="mr-2 size-4 text-destructive" />
                        <span className="text-destructive">Delete</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              )}
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroup>

      {/* 🔥 TAMBAH: Komponen Alert Dialog */}
      {/* Akan terbuka otomatis jika state chatToDelete terisi */}
      <AlertDialog
        open={!!chatToDelete}
        onOpenChange={(open) => !open && setChatToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus percakapan?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini tidak dapat dibatalkan. Percakapan{" "}
              <strong>"{chatToDelete?.title}"</strong> beserta seluruh pesannya
              akan dihapus secara permanen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault(); // Cegah modal tertutup instan sebelum database merespons
                confirmDelete();
              }}
              disabled={isLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isLoading ? "Menghapus..." : "Ya, Hapus"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
