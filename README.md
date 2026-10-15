# SafeSound

SafeSound es un monitor local de ruido para aulas. Esta primera versión prioriza funcionalidad, estabilidad y privacidad: analiza la intensidad del micrófono en el navegador, muestra un nivel estimado/relativo, estados configurables, gráfica, sesiones y eventos de exceso.

## Tecnología

La Fase 1 usa HTML/CSS/JavaScript modular sin framework para reducir dependencias y mantener el procesamiento local. La arquitectura está separada en `audio/`, `monitoring/`, `storage/`, `ui/` y `utils/`, de modo que puede migrarse posteriormente a una aplicación de escritorio.

## Ejecutar

Requiere Node.js si se quieren ejecutar las pruebas. Para la aplicación, cualquier servidor HTTP local sirve. Con Python:

```bash
python3 -m http.server 4173
```

Abre `http://localhost:4173`.

## Pruebas

```bash
npm test
```

## Medición

El valor mostrado es un nivel estimado/relativo derivado del RMS de la señal del micrófono. No debe interpretarse como dB SPL calibrados. Los micrófonos, drivers, ganancia automática y hardware pueden cambiar la relación entre señal y presión sonora. La arquitectura incluye un factor de calibración para una futura función de calibración.

## Privacidad

SafeSound no graba ni almacena conversaciones. El audio se usa únicamente para calcular intensidad en memoria y no se sube a Internet.

## Estado actual

Implementado: interfaz base, selección de micrófono, captura local, medición RMS, suavizado, estados, umbral configurable, gráfica, historial limitado, sesiones, estadísticas, eventos con duración mínima, persistencia de configuración, simulación, recuperación básica de errores y pruebas unitarias.

Siguiente evolución: mejorar recuperación ante cambios de dispositivos de Windows, persistencia de sesiones/historial consultable, calibración guiada, pruebas de integración de audio y empaquetado de escritorio.
