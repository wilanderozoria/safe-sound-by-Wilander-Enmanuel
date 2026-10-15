# Bitácora de Avances - SafeSound

Este documento registra la evolución del proyecto SafeSound desde el inicio de la intervención actual, detallando el estado inicial, los requerimientos solicitados y las soluciones implementadas.

## 1. Estado Inicial (Antes de iniciar)
El proyecto era un sistema de monitoreo acústico con una arquitectura basada en un servidor local.

- **Arquitectura**: Cliente-Servidor mediante Node.js y Socket.io.
- **Frontend**: Vanilla JS, HTML y CSS, alojado en GitHub Pages.
- **Funcionamiento**:
    - El procesamiento de audio se hacía localmente (RMS $\rightarrow$ dB relativo).
    - Los datos se enviaban a un servidor Node.js que actuaba como relé.
    - El Monitor recibía los datos del servidor via WebSockets.
- **Limitaciones**: 
    - Dependencia de un servidor Node.js activo y accesible vía Internet para que el sistema funcionara fuera de la red local.
    - Interfaz de navegación sencilla (selector en el header) no optimizada para la experiencia de usuario móvil.
    - No existía persistencia de datos; si el servidor se reiniciaba, se perdía el estado de las aulas.

## 2. Requerimientos Solicitados
El objetivo principal fue transformar la aplicación para que fuera verdaderamente distribuida y funcional desde GitHub Pages sin necesidad de gestionar un servidor propio.

- **Nueva Experiencia de Usuario**: Crear una pantalla de inicio moderna con dos opciones claras: "Mi teléfono como micrófono" y "Monitoreo de aulas".
- **Conectividad Real**: Lograr que un teléfono en cualquier lugar pudiera enviar mediciones a un monitor en otra computadora.
- **Infraestructura**: Migrar la comunicación de Socket.io a **Supabase**.
- **Procesamiento**: Mantener la medición local en el dispositivo para evitar transmitir audio bruto (privacidad y ancho de banda).
- **Persistencia**: Almacenar el último estado de cada aula en una base de datos.
- **Seguridad**: Implementar Row Level Security (RLS) en la base de datos.

## 3. Implementaciones Realizadas

### A. Infraestructura de Datos (Supabase)
Sustituí el servidor Node.js por una arquitectura *Serverless* utilizando Supabase:
- **Base de Datos**: Creé la tabla `classroom_levels` para almacenar `room_id`, `level`, `status` y `updated_at`.
- **Sincronización**: Implementé **Supabase Realtime** para que el Monitor reciba actualizaciones instantáneas sin necesidad de refrescar la página.
- **Seguridad**: Configuré políticas de RLS para permitir la lectura y actualización pública de los niveles (acorde a la fase actual sin autenticación).

### B. Interfaz de Usuario y Navegación
- **Welcome Screen**: Diseñé y programé una pantalla de bienvenida responsiva con tarjetas interactivas.
- **Flujo de Navegación**: Implementé un sistema de gestión de modos (`welcome` $\rightarrow$ `client` / `monitor`) que oculta y muestra secciones de la aplicación dinámicamente.
- **UX Móvil**: Optimicé la sección del cliente para que sea usable en smartphones, incluyendo la persistencia del ID del aula en `localStorage`.

### C. Lógica del Sensor Móvil
- **Flujo de Medición**: Integré el `AudioEngine` existente con el cliente de Supabase.
- **Optimización de Red**: Programé un intervalo de envío cada 500ms utilizando la operación `upsert` de Supabase, lo que garantiza que solo exista una fila por aula y se reduzca la carga en la base de datos.
- **Control de Recursos**: Aseguré que el micrófono se libere correctamente al detener la medición o cambiar de modo.

### D. Adaptación del Monitor
- **Suscripción Realtime**: Modifiqué el `MonitorDashboard` para que, en lugar de esperar eventos de Socket.io, se suscriba a los cambios de la tabla de Supabase.
- **Estado Inicial**: Implementé la recuperación del estado actual de todas las aulas al cargar el monitor, eliminando el vacío de información al iniciar.

## 4. Resumen Técnico de Cambios

| Componente | Antes | Después |
|:---|:---|:---|
| **Transporte** | Socket.io (WebSockets) | Supabase Realtime (Postgres Changes) |
| **Backend** | Servidor Node.js / Express | Supabase (BaaS) |
| **Persistencia** | Memoria RAM del servidor | Tabla Postgres `classroom_levels` |
| **Navegación** | Selector en Header | Pantalla de Inicio dedicada |
| **Despliegue** | Frontend (GH Pages) + Backend (VPS/Local) | Frontend (GH Pages) $\rightarrow$ Cloud API |
