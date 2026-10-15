# SafeSound — Guía de construcción, plano y descripción

## 1. Descripción

**SafeSound** es una aplicación local para aulas que permite al profesor monitorear el nivel de sonido en tiempo real, detectar excesos y consultar estadísticas de una sesión.

Prioridades:

1. Funcionalidad
2. Estabilidad
3. Precisión y consistencia
4. Interfaz clara
5. Diseño

El audio se procesa localmente. SafeSound no debe grabar conversaciones, almacenar grabaciones ni enviar audio a Internet.

> **Limitación:** un micrófono común no proporciona necesariamente dB SPL calibrados. Por eso el nivel debe tratarse como estimado/relativo hasta implementar calibración.

---

## 2. Plano general

```text
                    ┌──────────────────┐
                    │    SafeSound     │
                    │ Aplicación local │
                    └────────┬─────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │   Audio Engine   │
                    │ Micrófonos       │
                    │ Captura          │
                    └────────┬─────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │  Procesamiento   │
                    │ RMS / nivel      │
                    │ suavizado        │
                    └────────┬─────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │ Monitor State    │
                    │ estados          │
                    │ umbrales         │
                    │ histeresis       │
                    │ eventos          │
                    └───────┬──────────┘
                            │
             ┌──────────────┼──────────────┐
             ▼              ▼              ▼
       Persistencia      Sesiones          UI
       configuración     promedio          nivel
       preferencias      máximo            estado
       historial         duración          gráfica
                          eventos           ajustes
```

### Flujo del audio

```text
Micrófono
   ↓
Captura
   ↓
Intensidad / RMS
   ↓
Nivel estimado
   ↓
Suavizado
   ↓
Clasificación
   ├── NORMAL
   ├── ADVERTENCIA
   └── EXCESIVO
          ↓
       Eventos
          ↓
      Estadísticas
```

---

## 3. Estructura actual

La versión v0.2 entregada contiene:

- `tests/session.test.js`
- `tests/measurement.test.js`
- `index.html`
- `README.md`
- `package.json`
- `src/audio/simulator.js`
- `src/audio/audio-engine.js`
- `src/storage/settings.js`
- `src/ui/styles.css`
- `src/ui/chart.js`
- `src/app.js`
- `src/utils/measurement.js`
- `src/monitoring/session.js`

La estructura puede evolucionar, pero se debe evitar volver a un único archivo gigantesco.

---

## 4. Manual de construcción

### Paso 1 — Preparar el entorno

La aplicación puede servirse localmente con:

```bash
python -m http.server 4173
```

Después:

```text
http://localhost:4173
```

No se recomienda abrir `index.html` directamente para probar el micrófono debido a las restricciones de seguridad de las APIs del navegador.

### Paso 2 — Iniciar SafeSound

1. Abrir la aplicación.
2. Conceder permiso al micrófono.
3. Seleccionar el micrófono.
4. Iniciar monitoreo.
5. Verificar el nivel.
6. Verificar el estado.
7. Comprobar la gráfica.

### Paso 3 — Probar simulación

El modo simulación permite generar niveles como:

```text
45 → 52 → 61 → 68 → 72 → 80 → 90
```

Debe permitir comprobar estados, gráfica, eventos y estadísticas sin micrófono físico.

---

## 5. Audio Engine

Responsabilidades:

- Detectar micrófonos.
- Solicitar permisos.
- Seleccionar dispositivo.
- Capturar audio.
- Analizar intensidad.
- Detectar desconexiones.
- Recuperarse de errores.
- Detener correctamente la captura.

Un fallo del micrófono **nunca debe congelar toda la aplicación**.

---

## 6. Procesamiento

El procesamiento conceptual es:

```text
Muestras de audio
       ↓
RMS
       ↓
Nivel estimado
       ↓
Suavizado
       ↓
Valor mostrado
```

El suavizado evita que el número cambie inútilmente con cada pequeña fluctuación.

---

## 7. Estados y umbrales

Ejemplo:

```text
Umbral: 70
```

Estados:

```text
🟢 NORMAL
🟡 ADVERTENCIA
🔴 EXCESIVO
```

Los límites deben ser configurables. No debe asumirse que un único nivel sirve para todas las aulas.

El color no debe ser el único indicador: siempre debe aparecer texto/estado.

---

## 8. Histeresis y eventos

Un pequeño cambio alrededor del límite no debe generar eventos repetitivos.

```text
Nivel supera límite
        ↓
¿Permanece durante el tiempo mínimo?
     ↙       ↘
   NO         SÍ
   ↓           ↓
Ignorar     Registrar
fluctuación  evento
```

Un evento puede contener:

```text
timestamp
nivel
duración
```

Esto evita registrar cientos de eventos por pequeñas fluctuaciones.

---

## 9. Sesiones

Flujo:

```text
INICIAR MONITOREO
       ↓
SESIÓN ACTIVA
       ↓
mediciones + eventos
       ↓
DETENER MONITOREO
       ↓
RESUMEN
```

El resumen puede incluir:

- Duración.
- Nivel promedio.
- Nivel máximo.
- Tiempo por encima del umbral.
- Cantidad de eventos.

---

## 10. Historial

Los registros pueden contener:

```text
timestamp
nivel
estado
micrófono
```

El historial debe estar limitado para evitar crecimiento infinito.

Ventanas previstas:

- 30 segundos.
- 1 minuto.
- 5 minutos.

---

## 11. Configuración y persistencia

Debe guardarse localmente:

- Micrófono seleccionado.
- Umbral.
- Zona de advertencia.
- Duración mínima de exceso.
- Ventana de historial.
- Preferencias.
- Alertas.

No debe depender de Internet.

---

## 12. Alertas

Las alertas pueden ser visuales y opcionalmente sonoras/notificaciones.

Debe existir cooldown para evitar:

```text
ruido alto
↓
alerta
↓
alerta
↓
alerta
↓
alerta
```

En lugar de eso:

```text
ruido alto
↓
alerta
↓
cooldown
↓
esperar recuperación
```

---

## 13. Interfaz

El nivel actual debe ser el elemento principal.

```text
┌──────────────────────────────┐
│                              │
│            72                │
│             dB               │
│                              │
│       🟡 ADVERTENCIA         │
│                              │
└──────────────────────────────┘
```

También debe mostrar:

- Gráfica.
- Umbral.
- Tiempo de monitoreo.
- Micrófono.
- Estado del sistema.
- Controles de sesión.
- Configuración.

Principio:

> **VISIBILIDAD > DECORACIÓN**

---

## 14. Modo Aula

Debe priorizar:

```text
NIVEL ACTUAL
ESTADO
GRÁFICA
UMBRAL
```

La información debe poder entenderse desde cierta distancia.

---

## 15. Privacidad

SafeSound debe seguir:

```text
MICRÓFONO
   ↓
ANÁLISIS LOCAL
   ↓
NIVEL
   ↓
ESTADO / ESTADÍSTICAS
```

No:

```text
MICRÓFONO
   ↓
GRABACIÓN
   ↓
SERVIDOR
```

No se deben almacenar conversaciones de estudiantes.

---

## 16. Manejo de errores

Casos importantes:

- Micrófono desconectado.
- Windows cambia el dispositivo.
- Permiso rechazado.
- Dispositivo no disponible.
- Valor inválido.
- Error de API de audio.
- Fallo de gráfica.
- Pérdida temporal del dispositivo.

Patrón:

```text
ERROR
 ↓
DETECTAR
 ↓
MOSTRAR
 ↓
RECUPERAR SI ES POSIBLE
 ↓
MANTENER UI FUNCIONANDO
```

---

## 17. Pruebas

Las partes críticas deben poder probarse sin micrófono real:

- Cálculo de nivel.
- Suavizado.
- Umbrales.
- Estados.
- Histeresis.
- Eventos.
- Cooldown.
- Persistencia.
- Recuperación de errores.

La versión inicial fue comprobada con **7 pruebas automatizadas**, todas pasando antes de la actualización visual.

---

## 18. Calibración futura

La arquitectura debe permitir:

```text
Nivel de referencia
       +
Medición del micrófono
       ↓
Factor de calibración
       ↓
Nivel calibrado
```

No se requiere una calibración profesional en la primera versión.

---

## 19. Fases de desarrollo

### Fase 1
Proyecto, estructura y UI básica.

### Fase 2
Detección, selección, captura y medición de micrófono.

### Fase 3
Procesamiento, suavizado, estados, umbrales e histeresis.

### Fase 4
Gráfica, historial y sesiones.

### Fase 5
Configuración, persistencia y alertas.

### Fase 6
Errores, recuperación, simulación y pruebas.

### Fase 7
Pulido UI/UX y modo Aula.

### Fase 8
Preparación para aplicación de escritorio Windows.

---

## 20. Arquitectura futura de escritorio

```text
┌────────────────────────────┐
│       UI DE ESCRITORIO     │
├────────────────────────────┤
│       SafeSound UI         │
├────────────────────────────┤
│ Monitor + Processing       │
├────────────────────────────┤
│ Audio Engine               │
├────────────────────────────┤
│ Windows Audio              │
└────────────────────────────┘
```

La lógica de monitorización debe mantenerse independiente de la interfaz para facilitar la futura conversión a escritorio.

---

## 21. Reglas de mantenimiento

Antes de modificar el proyecto:

1. Inspeccionar la estructura.
2. Entender las dependencias.
3. No destruir trabajo funcional.
4. Evitar dependencias innecesarias.
5. Hacer cambios pequeños.
6. Ejecutar pruebas.
7. Ejecutar la aplicación.
8. Revisar errores.
9. Verificar la interfaz.
10. Continuar solo cuando la modificación esté estable.

---

## 22. Descripción corta para presentar el proyecto

**SafeSound** es una aplicación de monitoreo acústico para aulas que analiza localmente el sonido capturado por un micrófono y ayuda al profesor a identificar cuándo el nivel del aula se mantiene dentro de un rango adecuado o supera un límite configurado.

La aplicación muestra el nivel actual, estado, gráfica, historial y estadísticas de sesión, incorpora simulación para pruebas y está diseñada para evolucionar posteriormente hacia una aplicación de escritorio.

Su enfoque principal es funcionalidad, estabilidad, privacidad y facilidad de interpretación.

---

## 23. Estado actual

La versión actual corresponde a una base funcional con una interfaz visual mejorada.

Próximos objetivos recomendados:

1. Fortalecer recuperación de dispositivos de audio.
2. Mejorar historial persistente.
3. Completar alertas y cooldown.
4. Ampliar pruebas.
5. Completar modo Aula.
6. Diseñar calibración.
7. Empaquetar para Windows.

**SafeSound debe seguir evolucionando sin romper las funciones que ya funcionan.**
