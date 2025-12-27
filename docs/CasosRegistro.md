# Casos de Registro y Flujos de Usuario

Este documento define la secuencia intuitiva para crear registros según su naturaleza, asegurando que el Stepper de la aplicación sea dinámico y eficiente.

## 1. Clasificación de Casos de Registro

### A. Registro Rápido (Borrador)
*   **Objetivo**: Capturar una idea o compromiso sin interrumpir la actividad actual.
*   **Flujo**:
    1.  Nombre del registro.
    2.  Check: "Guardar como Borrador".
    3.  Finalizar (El sistema asigna área/contexto por defecto).

### B. Registro de Compromiso Fijo (Confirmado)
*   **Objetivo**: Agendar un evento con tiempo y lugar exactos.
*   **Flujo**:
    1.  Identidad (Nombre, Área, Contexto).
    2.  Tiempo (Fecha, Hora Inicio, Hora Fin, Recurrencia).
    3.  Logística (Lugar/Link, Buffers de tránsito).
    4.  Validación de Conflictos (Visualización de choques).
    5.  Confirmar.

### C. Registro por Conflicto (En Estudio)
*   **Objetivo**: Gestionar dos eventos que compiten por el mismo espacio.
*   **Flujo**:
    1.  Detección automática de cruce al intentar confirmar.
    2.  Visualización comparativa (Timeline A vs B).
    3.  Resolución:
        *   Opción A: Marcar el nuevo como "En Estudio" (ambos ocupan el espacio visualmente).
        *   Opción B: Desplazar el existente (Efecto dominó).
        *   Opción C: Aplazar el nuevo.

### D. Registro Multi-Perfil (Familiar)
*   **Objetivo**: Crear un evento que afecta a varios miembros del hogar.
*   **Flujo**:
    1.  Identidad + Selección de Perfiles (Ej: Mamá + Hija 1).
    2.  Tiempo Único.
    3.  Escaneo de Conflictos en AMBAS agendas.
    4.  Confirmación dual.

---

## 2. Flujo Secuencial del Stepper Dinámico

El Stepper no es lineal; oculta o muestra pasos según la necesidad:

| Paso | Sección | Comportamiento |
|---|---|---|
| 1 | **¿Qué vas a registrar?** | Título + Selector de Tipo (Evento/Tarea/Estado). |
| 2 | **¿De quién y para qué?** | Selector de Perfil + Área/Contexto. |
| 3 | **¿Cuándo ocurre?** | *Omitir si es Borrador*. Fecha/Hora + Recurrencia. |
| 4 | **Logística y Recursos** | Buffers + Vincular Artefactos (Cursos, Links). |
| 5 | **Resolución** | Solo aparece si el Motor de Conflictos detecta alertas. |

---

## 3. Lógica de Estados en el Registro

Según lo definido en `draft.md`, los registros transitan por los siguientes estados:

1.  **Borrador**: Estado inicial de captura rápida.
2.  **Confirmado**: Cuando se tiene certeza absoluta de tiempo y lugar.
3.  **En Estudio**: Resultado de un conflicto no resuelto manualmente donde ambos registros "compiten" por el tiempo.
4.  **Aplazado**: El registro se movió a una fecha futura indeterminada.
5.  **Descartado**: El registro ya no es necesario (equivale a un borrado lógico).

---

## 4. Matriz de Priorización de Conflictos

| Tipo de Registro | Prioridad | Comportamiento ante conflicto |
|---|---|---|
| Crítico (Hard) | Alta | No permite ser movido. Fuerza a otros a aplazarse o estudiarse. |
| Flexible (Soft) | Media | El sistema sugiere moverlo automáticamente si llega un Crítico. |
| Borrador | Baja | No bloquea el calendario de otros perfiles. |
