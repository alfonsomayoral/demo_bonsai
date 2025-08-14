import { useEffect } from 'react';

export function useFrameworkReady() {
  useEffect(() => {
    // En web: notifica al contenedor de pruebas si existe.
    // En nativo: no falla porque chequeamos con globalThis/window opcional.
    try {
      (globalThis as any)?.window?.frameworkReady?.();
    } catch {}
  }, []); // <- solo una vez
}
