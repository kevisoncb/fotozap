"use client";

import { useState } from "react";
import { MoreVertical, UserX, UserCheck, Shield, Key } from "lucide-react";
import { updateAdminStatus, updateAdminRole, resetAdminPassword } from "./actions";

type Admin = {
  id: string;
  email: string;
  name: string | null;
  role: string;
  status: string;
};

export function AdminActions({ admin }: { admin: Admin }) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleToggleStatus = async () => {
    setLoading(true);
    try {
      const newStatus = admin.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
      await updateAdminStatus(admin.id, newStatus);
      setIsOpen(false);
    } catch (error) {
      console.error("Failed to update status:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleRole = async () => {
    setLoading(true);
    try {
      const newRole = admin.role === "ADMIN" ? "VIEWER" : "ADMIN";
      await updateAdminRole(admin.id, newRole);
      setIsOpen(false);
    } catch (error) {
      console.error("Failed to update role:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    const newPassword = prompt("Digite a nova senha (mínimo 8 caracteres):");

    if (!newPassword || newPassword.length < 8) {
      alert("Senha inválida. Deve ter no mínimo 8 caracteres.");
      return;
    }

    setLoading(true);
    try {
      await resetAdminPassword(admin.id, newPassword);
      alert("Senha resetada com sucesso!");
      setIsOpen(false);
    } catch (error) {
      console.error("Failed to reset password:", error);
      alert("Erro ao resetar senha");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="text-gray-400 hover:text-white transition-colors p-1 rounded hover:bg-gray-800"
      >
        <MoreVertical size={18} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-56 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-20">
            <div className="py-1">
              <button
                onClick={handleToggleRole}
                disabled={loading}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors disabled:opacity-50"
              >
                <Shield size={16} />
                {admin.role === "ADMIN" ? "Tornar Viewer" : "Tornar Admin"}
              </button>

              <button
                onClick={handleToggleStatus}
                disabled={loading}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors disabled:opacity-50"
              >
                {admin.status === "ACTIVE" ? (
                  <>
                    <UserX size={16} />
                    Suspender
                  </>
                ) : (
                  <>
                    <UserCheck size={16} />
                    Reativar
                  </>
                )}
              </button>

              <button
                onClick={handleResetPassword}
                disabled={loading}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors disabled:opacity-50"
              >
                <Key size={16} />
                Resetar Senha
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
