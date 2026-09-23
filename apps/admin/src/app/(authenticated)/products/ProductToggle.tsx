"use client";

import { useState, useTransition } from "react";
import { toggleProductActive } from "./actions";

type ProductToggleProps = {
  productId: string;
  initialActive: boolean;
};

export function ProductToggle({ productId, initialActive }: ProductToggleProps) {
  const [isActive, setIsActive] = useState(initialActive);
  const [isPending, startTransition] = useTransition();

  const handleToggle = () => {
    const newState = !isActive;
    setIsActive(newState);

    startTransition(async () => {
      try {
        await toggleProductActive(productId, newState);
      } catch (error) {
        setIsActive(!newState);
        console.error("Failed to toggle product:", error);
      }
    });
  };

  return (
    <button
      onClick={handleToggle}
      disabled={isPending}
      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
        isActive
          ? "bg-green-500/20 text-green-400 hover:bg-green-500/30"
          : "bg-gray-700 text-gray-400 hover:bg-gray-600"
      } disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      {isActive ? "Ativo" : "Inativo"}
    </button>
  );
}
