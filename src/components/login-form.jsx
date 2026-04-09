"use client"; // 1. WAJIB ditambahkan di baris paling atas

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/client"; // 2. Jangan di-alias as supabase
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function LoginForm({ className, ...props }) {
  const supabase = createClient();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setLoading(false);
      alert(error.message);
      return;
    }

    // Buat chat langsung setelah login
    const { data: chat, error: chatError } = await supabase
      .from("chats")
      .insert({ user_id: data.user.id, title: "New Chat" })
      .select("id")
      .single();

    setLoading(false);

    if (chatError || !chat) {
      alert("Gagal membuat chat");
      return;
    }

    router.push(`/chat/${chat.id}`);
  };

  const loginWithGoogle = () => {
    supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  // const loginWithFacebook = async () => {
  //   await supabase.auth.signInWithOAuth({
  //     provider: "facebook",
  //     options: {
  //       redirectTo: `${window.location.origin}/auth/callback`,
  //     },
  //   });
  // };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Make market simple for you</CardTitle>
          <CardDescription>
            Login with your Google or Facebook account
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Sisa UI Anda tetap sama persis, tidak ada yang perlu diubah */}
          <form onSubmit={handleLogin}>
            <FieldGroup>
              <Field>
                {/* Google */}
                <Button
                  variant="outline"
                  type="button"
                  onClick={loginWithGoogle}
                >
                  <Image
                    src="/google.avif"
                    alt="Google"
                    width={16}
                    height={16}
                    className="w-4 h-4"
                  />
                  Login with Google
                </Button>
                {/* Facebook (Bisa di-uncomment nanti kalau sudah siap) */}
              </Field>
              <FieldSeparator className="*:data-[slot=field-separator-content]:bg-card">
                Or continue with
              </FieldSeparator>
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </Field>
              <Field>
                <div className="flex items-center">
                  <FieldLabel htmlFor="password">Password</FieldLabel>
                  <a
                    href="#"
                    className="ml-auto text-sm underline-offset-4 hover:underline"
                  >
                    Forgot your password?
                  </a>
                </div>
                <Input
                  id="password"
                  type="password"
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </Field>
              <Field>
                <Button type="submit" disabled={loading}>
                  {loading ? "Loading..." : "Login"}
                </Button>
                <FieldDescription className="text-center">
                  Don&apos;t have an account? <a href="/signup">Sign up</a>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
