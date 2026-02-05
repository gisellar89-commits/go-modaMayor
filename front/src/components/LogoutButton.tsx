"use client";
import { useRouter } from "next/navigation";
import { logout } from "@/hooks/useActivityTracking";

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    await logout(router);
  };

  return (
    <button
      className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
      onClick={handleLogout}
    >
      Cerrar sesión
    </button>
  );
}
