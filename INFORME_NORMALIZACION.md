# Informe de Normalización de Características de Componentes y Tipografía
## ClassApp - Sistema de Diseño "Bosque Profundo"

Este documento detalla los estándares de diseño implementados en la aplicación, consolidando las decisiones de normalización para tipografía, colores, espaciado y comportamiento de componentes.

---

## 1. Sistema de Tipografía Estático y Dinámico

La tipografía se ha normalizado centralizando todos los valores en `design-tokens.scss` y aplicándolos globalmente en `global.scss`.

### Fuente Base
Se utiliza una pila de fuentes del sistema para máximo rendimiento y legibilidad nativa:
`-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif`

### Escala Tipográfica (Mobile Base)
La escala está definida en `rem` para respetar las preferencias del usuario, con valores base en `root`:

| Token | Variable | Tamaño (rem/px) | Uso Previsto |
|-------|----------|-----------------|--------------|
| Headline L | `--font-size-h1` | 1.75rem (28px) | Títulos de página principales |
| Headline M | `--font-size-h2` | 1.5rem (24px) | Títulos de sección grandes |
| Headline S | `--font-size-h3` | 1.375rem (22px) | Encabezados de tarjetas |
| Title L | `--font-size-h4` | 1.25rem (20px) | Subtítulos destacados |
| Title M | `--font-size-h5` | 1.125rem (18px) | Encabezados de listas |
| Body L | `--font-size-body-lg` | 1rem (16px) | Texto de lectura principal |
| Body M | `--font-size-body` | 0.875rem (14px) | Texto estándar (WCAG min) |
| Label L | `--font-size-small` | 0.75rem (12px) | Metadatos, etiquetas |
| Label M | `--font-size-xs` | 0.6875rem (11px) | Captions, notas al pie |

### Comportamiento Responsive
La tipografía escala automáticamente mediante *Media Queries* en tokens globales:
*   **Tablet (768px - 991px):** Aumento sutil. Cuerpo sube a 15px.
*   **Desktop (≥ 992px):** Aumento del 10%. Títulos principales llegan a ~31px.

### Normalización de Etiquetas HTML
En `global.scss`, las etiquetas nativas (`h1` - `h6`, `p`) se mapean automáticamente a estas variables, eliminando márgenes superiores (`margin-top: 0`) para un control de flujo vertical predecible.

---

## 2. Paleta de Colores "Bosque Profundo"

Definida en `variables.scss`, esta paleta prioriza el contraste y la jerarquía visual profesional.

### Paleta Principal
*   **Primary (Azul Profundo):** `#1e40af` (Light) / `#3b82f6` (Dark). Transmite confianza y profesionalismo.
*   **Secondary (Indigo Suave):** `#6366f1` (Light) / `#0ea5e9` (Dark). Para acciones secundarias y acentos.
*   **Tertiary (Amber):** `#f59e0b`. Usado para elementos destacados o llamadas de atención sutiles.

### Colores de Estado (Feedback)
Normalizados para cumplir estándares de accesibilidad (contraste):
*   **Success (Oliva):** `#15803d`. Más oscuro que el verde estándar para mejor lectura sobre blanco.
*   **Warning (Ocre):** `#d99036`.
*   **Danger (Ladrillo):** `#991b1b`. Rojo profundo para errores críticos.

### Modo Oscuro
Implementación completa basada en Material Design:
*   Fondos en gris oscuro (`#121212`, `#1e1e1e`) en lugar de negro puro para reducir fatiga visual.
*   Colores primarios más luminosos/saturados para mantener visibilidad sobre fondos oscuros.
*   Textos en gris muy claro (`#f1f5f9`) para evitar contraste excesivo ("efecto halación").

---

## 3. Características de Componentes

### Espaciado y Ritmo
Sistema basado en una grilla de **4px**, definido en variables `--space-*`.
*   Unidad base: `--space-1` = 0.25rem (4px).
*   Espaciado estándar de componentes: `--space-4` (16px).
*   Separación de secciones: `--space-8` (32px).

### Bordes y Formas
Estandarización de `border-radius` para una apariencia moderna y amigable:
*   `--radius-md`: 10px (Inputs, elementos medios).
*   `--radius-lg`: 12px (Tarjetas, modales, contenedores principales).
*   `--radius-full`: 9999px (Badges, botones redondeados).

### Sombras y Elevación
Sistema de profundidad (`--shadow-*`) normalizado:
*   `--shadow-sm`: Para elementos interactivos pequeños.
*   `--shadow-md`: Estándar para tarjetas (`ion-card`).
*   `--shadow-lg`: Para elementos flotantes o modales.
*   **Dark Mode:** Las sombras se ajustan automáticamente a opacidades más altas (hasta 60%) para ser visibles sobre fondos oscuros.

### Botones e Interactividad (Touch Targets)
Para cumplir con estándares de accesibilidad móvil:
*   **Tamaño Mínimo:** Todos los botones tienen `min-height` y `min-width` de **44px** (`--button-min-height`).
*   **Iconos:** Tamaños estandarizados en 24px (`--button-icon-size`).
*   **Inputs:** Altura estandarizada de 44px con padding interno de 16px.

---

## 4. Componentes Específicos Normalizados

### Accordions (Acordeones)
Diseño personalizado en `global.scss`:
*   Bordes redondeados (12px) y sombras suaves.
*   Estados distinguibles: Normal, Hover, y Expandido (con borde activo y fondo gradiente sutil).
*   Iconos con fondo decorativo degradado según el color del tema.

### Modales
*   Respeto estricto de **Safe Areas** (iPhone notch) definido globalmente.
*   Botones de pie de página estandarizados: Primario a la derecha, Secundario/Cancelar a la izquierda.

## 5. Estrategia Responsive Global

El layout se adapta mediante variables CSS y clases de utilidad:
1.  **Mobile First:** Diseño base optimizado para tacto y pantallas pequeñas.
2.  **Safe Area:** Inyección automática de variables `env(safe-area-inset-*)` para notches en iOS/Android.
3.  **Large Screens (Desktop):**
    *   Uso de `ion-split-pane` para navegación lateral.
    *   Centrado del contenido principal con `max-width: 1200px`.
    *   Fondo de aplicación diferenciado (`#f4f5f8` o `#0d0d0d`) para enmarcar el contenido central.
