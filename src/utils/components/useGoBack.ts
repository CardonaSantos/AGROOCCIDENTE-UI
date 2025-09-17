// src/components/navigation/use-go-back.ts
import { useCallback } from "react";
import { useNavigate } from "react-router-dom";

/**
 * Devuelve una función goBack():
 * - Si hay historial, navega atrás.
 * - Si no, navega al fallback (por defecto "/").
 */
export function useGoBack(fallback: string = "/") {
  const navigate = useNavigate();

  return useCallback(() => {
    if (typeof window !== "undefined" && window.history.length > 2) {
      navigate(-1);
    } else {
      navigate(fallback);
    }
  }, [navigate, fallback]);
}

// import { useCallback } from "react";
// import { useRouter } from "next/navigation";
// export function useGoBack(fallback: string = "/") {
//   const router = useRouter();
//   return useCallback(() => {
//     if (typeof window !== "undefined" && window.history.length > 2) router.back();
//     else router.push(fallback);
//   }, [router, fallback]);
// }
