# Borrador de Lógica de Negocio: Sistema de Registros (Agenda)

## Arquitectura Técnica: Sistema "Agenda -> Registro"

Para garantizar escalabilidad y personalización, la estructura se basa en un modelo de clases jerárquico:

*   **Agenda (Clase Abstracta / Interfaz)**: Define el contrato base. Todos los elementos de la agenda comparten un ADN común (ID, Nombre, Área, Contexto, Tipo, Estado, Reglas de Tiempo).
*   **Registro (Entidad Base Operativa)**: Es la implementación concreta de la Agenda. Un Registro es el contenedor universal que, según sus propiedades, se comporta como uno de los tipos funcionales.

## Jerarquía de Clasificación y Personalización

Para que el sistema sea Truly Personalizable, el **Registro** se clasifica mediante una estructura de 3 niveles:

### 1. Área (Nivel Macro / Dimensión)
Es la división principal de la vida del usuario. Permite separar lógicas de conflicto (ej. no mezclar buffers de trabajo con actividades sociales).
*   **Trabajo**: Todo lo productivo/laboral.
*   **Familiar**: Núcleo del hogar y familia extendida.
*   **Personal**: Desarrollo propio, salud y hobbies.
*   **Social/Comunidad**: Iglesia, amigos, eventos externos.

### 2. Contexto (Nivel Situacional)
Define el "dónde" o el "quién". Es dinámico y creado por el usuario.
*   Ejemplos en Área Trabajo: `Sede Norte`, `Virtual`, `Consultorio`.
*   Ejemplos en Área Familiar: `Hija 1`, `Hija 2`, `Hogar (General)`.
*   Ejemplos en Área Personal: `Gym`, `Estudio Inglés`.

### 3. Tipo (Nivel Funcional)
Define el comportamiento técnico y visual del registro:
*   **Evento**: Bloque con duración (Inicio/Fin).
*   **Tarea**: Ítem con estado de cumplimiento (Checklist).
*   **Recordatorio**: Alerta puntual.
*   **Tiempo Libre**: Bloque de disponibilidad proactiva.

---

## Propuesta de Concepto: "Registro" Universal
El término **Registro** se utilizará como la entidad base de la agenda, permitiendo una personalización total. Un Registro puede mutar o comportarse como diferentes tipos de entrada según su configuración.

### 1. Tipos de Registro
*   **Evento**: Una entrada con un tiempo asignado (inicio y fin) y una ubicación. Puede contener una lista de tareas asociadas.
*   **Tarea**: Una acción que debe realizarse. Puede ser independiente o estar vinculada a uno o varios eventos. Tiene un estado (completada/pendiente).
*   **Recordatorio**: Una notificación puntual sin necesariamente tener una duración, destinada a alertar sobre algo específico.
*   **Tiempo Libre**: Bloques de tiempo declarados explícitamente por el usuario para ocio, descanso o simplemente disponibilidad. Se trata como un registro para poder visualizar huecos organizables.

### 2. Contextos Jerárquicos (Sub-categorías)
Para una personalización total, cada categoría se desglosa en sub-ítems específicos:

*   **Trabajo**: Permite segmentar por unidad de negocio o ubicación (ej. Lugar de Trabajo 1, Sede Norte, Home Office).
*   **Familiar**: Configuración por miembros de la familia:
    *   **Perfiles Individuales**: Cada miembro (Hijo 1, Hija 2, Pareja). Cada uno posee un **Artefacto de Perfil** que estructura sus áreas de responsabilidad:
        *   **Colegio/Educación**: Actividades académicas.
        *   **Salud/Citas**: Seguimiento médico.
        *   **Deberes**: Responsabilidades en el hogar.
    *   **Colectivo**: "Todos" (para eventos que involucran al núcleo completo).
*   **Vistas de Análisis Familiar**:
    *   **Filtrado Selectivo**: Ver la agenda exclusivamente de un miembro o del grupo "Todos".
    *   **Comparativa Temporal**: Superposición de agendas de 2 o más miembros para identificar conflictos de logística (ej. ¿quién lleva a Hija 1 al colegio si Papá tiene reunión?).
*   **Personal**: Ámbitos específicos del desarrollo del usuario:
    *   **Salud/Bienestar**: Dieta, Gimnasio.
    *   **Hobby/Desarrollo**: Práctica de Instrumento.
    *   **Social**: Amigos, Reuniones informales.

### 3. Check-list de Tareas Multi-Contexto
Un **Evento** centralizado puede orquestar tareas de diferentes naturalezas:
*   Un evento de categoría **Trabajo** puede contener tareas del contexto **Personal** (ej. "Llamar al banco" durante el hueco del almuerzo) o **Familiar** (ej. "Confirmar recogida del colegio").
*   Cada ítem de la checklist mantiene su propia identidad de contexto y estado de completado.

### 4. Artefactos Proyectuales y Vinculación
Un Registro deja de ser solo un bloque de tiempo para convertirse en un **Contenedor de Recursos** (Artefactos):

*   **Artefactos Lógicos**: Datos estructurados internos (ej. Vincular con el modelo `Curso`, `Lugar de Trabajo`, `Estudiantes`).
    *   Al crear un registro laboral de "Clase", el artefacto lógico inyecta automáticamente el Código del Curso y el Salón asociado.
*   **Artefactos Digitales/Físicos**: Vínculos a elementos externos:
    *   **Archivos**: Adjuntos (PDF, Docs) necesarios para el registro.
    *   **Links**: Enlaces a reuniones virtuales o tableros de trabajo.
    *   **Referencias Físicas**: Campos de texto para indicar ubicación de objetos físicos (ej. "Caja 4 del depósito").
*   **Persistencia**: El registro actúa como el "indexador" que agrupa estos artefactos bajo un mismo propósito y tiempo.

### 5. Técnicas de Enfoque y Productividad
Un Registro (especialmente Tarea o Evento de estudio/trabajo) puede activar modos de ejecución específicos:

*   **Técnica Pomodoro**:
    *   Asociar ciclos (ej. 25 min enfoque / 5 min descanso) a un registro.
    *   El sistema contabiliza cuántos "Pomodoros" reales tomó completar la tarea vs. lo estimado.
*   **Time Boxing**:
    *   Definir un límite inamovible para una actividad. Al terminar el tiempo, el sistema fuerza el cierre o la re-evaluación del estado.
*   **Matriz de Eisenhower (Priorización)**:
    *   Clasificación automática en el Dashboard:
        *   **Urgente + Importante**: Registro Crítico (Hard).
        *   **No Urgente + Importante**: Borradores Proyectuales / Formación.
        *   **Urgente + No Importante**: Delegables (Familiar/Otros).
*   **"Eat the Frog" (La tarea del día)**:
    *   Marcar un único registro diario como la prioridad absoluta. El sistema lo resaltará visualmente y no sugerirá "Tiempo Libre" hasta que este se complete o descarte.

### 6. Lógica de Frecuencias y Recurrencia
Para permitir la "completa personalización", el sistema de fechas debe evolucionar de un modelo estático a uno de **Reglas de Ocurrencia**:

*   **Puntual (Único)**: Una sola instancia. Ej: Recordatorio "Llamar al médico" a las 10:00 AM.
*   **Rango Único**: Un evento con inicio y fin definidos que no se repite. Ej: "Viaje de fin de semana".
*   **Multiciclo Diario**: Repetición del mismo registro varias veces en un solo día (ej. "Tomar medicina" a las 8am, 2pm, 8pm).
*   **Réplica de Patrón**: Configurar un día (con sus horarios) y "clonarlo" a otros días específicos seleccionados a mano.
*   **Recurrencia Variable**: El registro se repite, pero cada ocurrencia puede tener horas distintas (ej. Lunes de 8-10am, Jueves de 6-8am).
*   **Control Semanal Avanzado**:
    *   Definición de patrones por día de la semana.
    *   Repetición por un número `X` de semanas.
    *   Selección de semanas no consecutivas (ej. semana 1 y 3 del mes).

### 7. Lógica de Estados y Gestión de Conflictos
La inteligencia del sistema reside en su capacidad para prevenir solapamientos y gestionar la incertidumbre:

*   **Estados del Registro**:
    *   **Confirmado**: El evento tiene fecha, hora y lugar definidos.
    *   **Borrador**: Registro creado pero sin planificación completa. Se guarda para definir detalles después.
    *   **En Estudio**: Un registro que está siendo analizado por conflictos con otros existentes.
    *   **Descartado/Aplazado**: Acciones tras una resolución de conflicto.
*   **Detección Inter-Área (Cross-Category Conflict)**:
    *   Al registrar o modificar, el sistema consulta la disponibilidad global.
    *   Identifica si un evento Familiar choca con uno Laboral o Personal.
    *   Muestra una comparativa visual de las áreas afectadas (Conflict View).
*   **Decisión Dinámica (Flujo de Cancelación/Conflicto)**:
    *   Si se cancela un registro, el sistema pregunta proactivamente:
        1.  **Convertir en Tiempo Libre**: Generar un bloque de disponibilidad automática.
        2.  **Adelantar Tarea**: Asignar el hueco a una tarea existente del estado "En Estudio" para adelantar trabajo.
        3.  **Crear Nuevo Registro**: Iniciar el flujo para un nuevo registro en ese espacio.
    *   Si hay conflicto al crear, el usuario puede: **Aplazar** el nuevo, **Re-programar** el existente, o dejar en **Estudio** ambos.
*   **Gestión de Flexibilidad (Priorización)**:
    *   **Registro Crítico (Hard)**: Inamovible (ej. Vuelo, Examen). Los conflictos con estos obligan a mover el resto.
    *   **Registro Flexible (Soft)**: Puede ser desplazado o comprimido (ej. Lectura, Gimnasio). El sistema sugiere "empujarlos" automáticamente si llega un Crítico.
*   **Conflictos de Buffers (Solapamiento Indirecto)**:
    *   Casos donde los eventos no chocan, pero sus **Tiempos Muertos** sí (ej. el tiempo de regreso de un evento personal choca con el inicio del trabajo).
    *   El sistema permite la **compresión de buffers** (ej. "Ir más rápido" o "almorzar en menos tiempo") para resolver el conflicto sin mover los eventos.
*   **Estado "En Suspenso" (Tentativo)**: 
    *   Registros que ocupan el espacio pero no bloquean la disponibilidad al 100%. Permiten que otros registros se sobrepongan en estado "En Estudio" hasta que se tome una decisión final.
*   **Propuesta Multiopción (Borrador Avanzado)**:
    *   Un borrador puede tener 2 o 3 opciones de horario posibles. Al confirmar una, las otras desaparecen y se liberan esos espacios.
*   **Cascada de Conflictos (Efecto Dominó)**:
    *   Detección de conflictos secundarios. Mover A resuelve el conflicto con B, pero crea uno nuevo con C. El sistema visualiza la ruta completa de la resolución.
*   **Conflicto de Ubicación (Lógica de Tránsito)**:
    *   Si el Registro A es en "Sede Norte" y el B es en "Casa", el sistema calcula si el buffer de tránsito entre ambos es físicamente posible. Si no, genera una alerta de "Inviabilidad Geográfica".
*   **Eventos Dependientes (Cascada de Cambios)**:
    *   Si el Registro A depende del Registro B, cualquier cambio en B afecta a A.
    *   **Configuración Seleccionable**: El usuario decide el comportamiento por cada relación:
        1.  **Automático**: Los cambios se aplican sin preguntar (ej. mover una tarea de estudio si la clase se mueve).
        2.  **Con Confirmación**: El sistema muestra una alerta informando el impacto y solicita aprobación antes de modificar los dependientes.
*   **Intervalos de Días**:
    *   Registros que no son una hora puntual ni una repetición semanal, sino un proceso continuo durante `N` días (ej. Periodo de "Digitación de Notas").
    *   Posibilidad de definir un tiempo de **"Antes"** (ej. Preparación o Tránsito al evento) y un tiempo de **"Después"** (ej. Regreso o Descanso).
    *   Cada tiempo muerto tiene su propia **Descripción Personalizada** (ej. "Conduciendo al trabajo", "Almuerzo previo", "Estiramiento post-gym").
    *   Estos tiempos marcan al usuario como **No Disponible** para otras áreas.
*   **Motor de Sugerencias Proactivo (Gestión de Huecos)**:
    *   **Generación Automática**: El sistema identifica huecos entre registros y los propone como "Tiempo Libre" (personalizable por el usuario).
    *   **Algoritmo de Prioridad (Confirmado)**: Ordenación de `menor a mayor coincidencia` usando la fórmula: `(Duración Registro + Buffers) / Tiempo Libre Disponible`.
    *   *Objetivo*: Maximizar la flexibilidad permitiendo ver primero las piezas que mejor encajan dejando margen residual.

### 8. Gestión Multi-Perfil (Familia de 4)
Para habilitar la comparativa y gestión de tiempo familiar, el sistema evoluciona de un usuario único a un modelo de **Agregación de Perfiles**:

*   **Estructura de Almacenamiento**: Cada uno de los 4 perfiles (Papá, Mamá, Hija 1, Hija 2) posee su propia instancia de `AgendaConfig` y su propia tabla/almacén de `Registros`.
*   **Sincronización de Vistas**: El Dashboard permite activar "Capas" de otros perfiles.
    *   *Ejemplo*: Al ver la agenda de Mamá, se puede superpolar la de Hija 1 para verificar quién la lleva a natación.
*   **Lógica de Proximidad**: El sistema detecta "Encuentros Familiares" cuando dos o más perfiles tienen el mismo `ID_Evento` o eventos con nombres similares en el mismo horario.

### 9. Recomendación de Motor de Persistencia: SQLite
Dada la complejidad del modelo de datos y la necesidad de gestión de conflictos avanzada, se propone el uso de **SQLite** (a través de Capacitor SQLite) frente a Ionic Storage por las siguientes razones:

1.  **Consultas Relacionales**: La detección de conflictos requiere buscar solapamientos cruzando `startTime`, `endTime`, `profileId`, `areaId` y `status`. Hacer esto en un almacén Clave-Valor (Ionic Storage) obligaría a cargar miles de registros en memoria y filtrarlos manualmente. Con SQLite, se resuelve con una consulta `SELECT` eficiente.
2.  **Integridad de Datos**: Permite definir `Foreign Keys` entre Áreas, Contextos y Registros, asegurando que al borrar un perfil o un área, no queden registros "huérfanos".
3.  **Escalabilidad**: Un sistema de agenda familiar que documenta el día a día puede alcanzar miles de entradas en un año. SQLite maneja grandes volúmenes de datos con índices, manteniendo la velocidad de respuesta.
4.  **Consistencia de Estados**: La gestión de estados (Borrador -> Confirmado) requiere transacciones para asegurar que los cambios se guarden correctamente sin corromper la base de datos local.

---

## Casos de Uso Ejemplificados (Validación de Robustez)

1.  **El Trayecto Laboral (Buffers + Categorías)**:
    *   Registro "Trabajo en Oficina" (08:00 - 12:00).
    *   Buffer Antes (30 min): "Conduciendo al trabajo".
    *   Buffer Después (30 min): "Conduciendo a casa".
    *   *Resultado*: El sistema bloquea desde las 07:30 hasta las 12:30. Si intentas meter un evento Familiar a las 07:45, el sistema detecta conflicto con "Conduciendo al trabajo".

2.  **Periodo de Exámenes (Intervalos + Dependencias)**:
    *   Registro "Digitación de Notas" (Intervalo: 15 al 20 de Enero).
    *   Categoría: Trabajo.
    *   *Dependencia*: Si el usuario marca un "Día Libre Familiar" el 16 de enero, el sistema alerta que la "Digitación de Notas" está en curso y sugiere re-evaluar la prioridad.

3.  **Cancelación Inteligente (Flujo de Decisión)**:
    *   Se cancela una "Reunión de Equipo" de 2 horas.
    *   *Acción*: El sistema abre el modal de decisión. El usuario elige "Adelantar Tareas".
    *   *Motor*: Muestra tareas "En Estudio" (ej. "Revisar correo", "Preparar informe") ordenadas por la fórmula de coincidencia de menor a mayor.

4.  **Evento de Trabajo con Tareas Familiares**:
    *   Evento: "Jornada Laboral Sede Norte" (08:00 - 17:00).
    *   Check-list Asociada:
        1. [Trabajo] Preparar Informe Semanal.
        2. [Familiar -> Hijo 1] Comprar cartulinas para el colegio.
        3. [Personal -> Dieta] Preparar ensalada para almuerzo.
    *   *Resultado*: La agenda permite gestionar responsabilidades cruzadas sin cambiar de vista, manteniendo la trazabilidad de a quién pertenece cada tarea.

5.  **Resolución de Dominó (Cascada + Prioridad)**:
    *   El usuario intenta agendar una "Reunión de Urgencia" (Crítico) de 10 a 11 am.
    *   Hay un conflicto con "Gimnasio" (Flexible).
    *   *Acción*: El sistema sugiere **Desplazar** el Gimnasio a las 11:30 am.
    *   *Conflicto Secundario*: Al mover el Gimnasio, este choca con "Almuerzo Familiar".
    *   *Visibilidad*: El usuario ve el mapa completo del cambio antes de aceptar.

6.  **Artefacto Lógico en Clase Universitaria**:
    *   Registro: "Clase Programación Móvil" (Contexto: Trabajo -> Sede 1).
    *   **Artefacto Lógico**: Vinculado al `Curso-ID: PROG_101`.
    *   **Artefacto Digital**: Enlace a la carpeta de Shared Drive con el material.
    *   *Resultado*: Al abrir el evento en la agenda, el usuario tiene acceso inmediato a la lista de estudiantes del curso, el código de acceso y el archivo de la sesión.

7.  **Gestión de Actividades de Hija 1**:
    *   **Contexto**: Familiar -> Hija 1.
    *   **Artefacto de Miembro**: Contiene "Tareas de Colegio", "Control de Crecimiento (Salud)" y "Arreglar habitación".
    *   **Vista de Comparación**: El usuario activa la vista compartida entre "Papá" e "Hija 1".
    *   *Resultado*: Se detecta que la cita médica de la hija choca con el buffer de tránsito del trabajo del padre. El sistema sugiere resolución de conflicto.

8.  **Sesión de Refuerzo con Pomodoro**:
    *   **Registro**: "Refuerzo Inglés Hija 1" (Papá y Hija).
    *   **Técnica**: Pomodoro (2 ciclos de 25 min).
    *   *Acción*: Al iniciar, la aplicación activa el cronómetro. Bloquea notificaciones externas y marca al Padre/Hija como "En Enfoque Profundo" para el resto de la familia.

9.  **Time Boxing en Labores de Hogar**:
    *   **Madre**: Define "Aseo General" con Time Box de 60 min.
    *   *Resultado*: El sistema le avisa 10 min antes de terminar para que cierre la actividad y pueda pasar a la siguiente tarea (ej. Almuerzo) sin retrasar el cronograma familiar.

10. **Coordinación de Refuerzo Académico (Dependencia + Buffers)**:
    *   **Padre**: Tiene una clase virtual (Trabajo) que termina a las 3:00 PM.
    *   **Hija 1**: Terapia física (Salud) de 2:00 a 4:00 PM (3 días/semana) + Refuerzo de Inglés (Educación).
    *   **Conflicto**: El refuerzo de inglés del Padre depende de su horario laboral y de que la Hija 1 regrese de terapia.
    *   **Motor**: El sistema propone el bloque de refuerzo a las 4:30 PM (Buffer de 30 min para regreso de Hija 1). Si el Padre tiene otra reunión, el sistema sugiere que la Madre cubra el refuerzo según su disponibilidad.

11. **Planificación Formación Madre (Borrador + Multiopción)**:
    *   **Madre**: Atiende hogar + gestión escolar hijas. Proyecta iniciar formación.
    *   **Estado**: "Borrador de Formación".
    *   **Lógica**: El sistema identifica los bloques de "Tiempo Libre Automático" de la Madre (ej. cuando las hijas están en el colegio y las labores de hogar están completas) y le ofrece opciones de horario para estudiar.

12. **Evento Dominical (Recurrencia con Excepción)**:
    *   **Registro**: "Asistencia Iglesia" (Contexto: Familiar / Social).
    *   **Recurrencia**: Semanal (Domingos).
    *   **Excepción**: "Viaje Familiar" (Intervalo de días).
    *   **Resolución**: Al agendar el viaje, el sistema detecta conflicto con el evento recurrente y ofrece "Aplazar/Omitir instancia" sin borrar el patrón para el domingo siguiente.

13. **Logística Danzas Hija 1 y 2 (Réplica de Patrón)**:
    *   **Danzas**: Viernes y Sábados.
    *   **Acción**: Se configura el patrón del Viernes (Hora de salida, Tránsito, Evento). Se aplica **"Réplica de Patrón"** al Sábado.
    *   *Beneficio*: Evita configurar doblemente la logística de transporte para el fin de semana.

---

## Flujo de Interacción: El Nuevo Modal de Registro (UX)

Para gestionar la complejidad sin abrumar al usuario, el flujo se divide en pasos inteligentes que se adaptan según las selecciones previas:

### Paso 1: Intención y Categoría (Identidad)
*   **Nombre del Registro**: Título descriptivo.
*   **Estado de Planificación**: Selección inicial entre `Confirmado` (pasa a fijar tiempos) o `Borrador` (guarda la idea para después).
*   **Tipo de Registro**: Iconos rápidos para `Evento`, `Tarea`, `Recordatorio` o `Tiempo Libre`.
*   **Contexto Jerárquico**: Selector de área (Trabajo, Familiar, Personal) y su sub-contexto (ej. Hija 1, Sede Norte).

### Paso 2: Configuración del Tiempo (Motor de Agenda)
*   **Definicón del Momento**:
    *   ¿Es puntual o recurrente?
    *   **Réplica de Patrón**: Opción para seleccionar un día ya configurado y "pegarlo" en otros días del mini-calendario.
    *   **Multiciclo Diario**: Agregar múltiples bloques de hora para el mismo registro.
*   **Gestión de Buffers (Tiempos Muertos)**:
    *   Configurar minutos "Antes" (ej. 30 min) con descripción (ej. "Tránsito").
    *   Configurar minutos "Después" (ej. 15 min) con descripción.

### Paso 3: Contenidos y Artefactos (Recursos)
*   **Vinculación Lógica**: Si es Trabajo, permite buscar y asociar un `Curso` o `Lugar`.
*   **Checklist Transversal**: Añadir tareas que pueden tener contextos diferentes al del registro principal.
*   **Material Digital**: Botón para adjuntar archivos o pegar links de referencia.

### Paso 4: Inteligencia de Conflictos (Resolución)
*   **Escaneo Automático**: El sistema muestra en tiempo real si hay solapamientos.
*   **Conflict View**: Si hay choque, se despliega una vista comparativa:
    *   "Este evento choca con: [Evento Laboral X] de 08:00 a 09:00".
*   **Toma de Decisión**: Botones de acción: `Aplazar Nuevo`, `Ocupar Espacio (Re-programar Flexible)` o `Mover a Estudio`.
*   **Regla de Cascada**: Configurar si los cambios dependientes serán `Automáticos` o `Con Confirmación`.

### Paso 5: Vista Previa y Cierre
*   **Preview**: Un pequeño timeline visual de cómo queda el bloque (incluyendo buffers) en el día.
*   **Confirmación**: Botón "Agendar Registro".

---

## Interfaz de Personalización: Ajustes de Agenda

Para permitir la autogestión de la jerarquía, se propone una nueva sección en **Ajustes > Agenda**:

### 1. Gestión de Áreas (Macros)
*   **Visualización**: Lista de las 4 áreas macro (`Trabajo`, `Familiar`, `Personal`, `Social`).
*   **Acciones**: Permite cambiar el alias del área (ej. "Familiar" por "Hogar") y asignar un color global.

### 2. Gestión de Contextos (Situacionales)
*   **Pantalla "Mis Contextos"**:
    *   **Botón (+)**: Crear nuevo contexto (ej. "Virtual", "Sede Norte", "Hija 1").
    *   **Relación Directa**: Al crear o editar un contexto, se presenta un selector de Área:
        *   `[ ] Relacionar con Área:` -> [Selector: Trabajo / Familiar / Personal / Social].
*   **Lógica de Relación**:
    *   Se guarda una relación M:N (un contexto puede pertenecer a varias áreas, aunque lo común será 1:1).
    *   **Ejemplo**: El usuario crea "Consultorio" y lo marca como contexto de "Trabajo". Cuando vaya a registrar un evento de Trabajo, "Consultorio" aparecerá como opción sugerida.

### 3. Personalización de Tipos
*   Permite definir buffers por defecto para cada tipo (ej. cada vez que creo un "Evento", sugerir 15 min antes).

---

## Análisis y Opinión del Asistente

*   **Propuesta de Valor**: La combinación de "Tiempo Libre Automático" y "Adelanto de Tareas" convierte la agenda en un sistema reactivo que ayuda al usuario a recuperar control ante imprevistos.

### Aclaraciones Necesarias para el Plan de Trabajo
1.  **Visualización en Timeline**: ¿Cómo se vería el tiempo muerto? (Sugerencia: Una franja con opacidad reducida unida al bloque del evento principal).
2.  **Intervalos**: ¿Un intervalo de días (ej. Digitación) se muestra como un bloque superior o como una tarea persistente?
3.  **Cálculo de Conflictos**: ¿El sistema debe alertar si el tiempo de regreso de un evento personal choca con el tiempo de preparación de uno laboral?

---

## Próximos Pasos Propuestos (Fases Actualizadas)

### Fase A: Refactorización de Datos (Registros Universales + Estados)
1. Definir la clase abstracta `AgendaItem` y el modelo `Registro` conforme a la nueva jerarquía de Áreas y Contextos.
2. Extender modelos para incluir `status` (Confirmado, Borrador, Estudio) y `dependencies: string[]`.
3. Actualizar `OccurrenceRule` para soportar `IntervalRange` (días continuos).

### Fase B: Motor de Inteligencia de Conflictos
1. Implementar el `ConflictEngine` que cruce datos de todas las categorías.
2. Desarrollar la lógica de dependencias y alertas por cambios.

### Fase C: Interfaz Atómica y Resolución de Conflictos
1. Crear el modal de "Resolución de Conflictos" con opciones de Aplazar/Descartar/Estudiar.
2. Actualizar el Stepper para permitir guardar como "Borrador" en cualquier paso.

