export default function VerifyEmailPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center space-y-4">
        <h1 className="text-2xl font-bold">Cek Email Kamu</h1>
        <p className="text-muted-foreground">
          Kami sudah kirim link konfirmasi ke email kamu.
          <br />
          Klik link tersebut untuk mengaktifkan akun.
        </p>
        <a href="/login" className="text-sm underline">
          Kembali ke Login
        </a>
      </div>
    </div>
  );
}
