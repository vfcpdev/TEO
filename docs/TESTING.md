# Plan de Pruebas - MVP Conflictos y Buffers

## Tests Unitarios

### ConflictEngineService
- ✅ Test 1: Servicio se crea correctamente
- ✅ Test 2: Detecta solapamiento total (mismo horario)
- ✅ Test 3: Detecta solapamiento parcial
- ✅ Test 4: NO detecta conflicto cuando eventos están separados
- ✅ Test 5: NO detecta conflicto entre perfiles diferentes
- ✅ Test 6: Genera opciones de resolución correctas

**Comando**: `npm test`  
**Estado**: Ejecutándose (verificar resultados)

---

## Tests Manuales en Navegador

### Test Manual 1: Detección de Conflicto Simple
**Objetivo**: Verificar que sistema detecta overlap y marca "En Estudio"

**Pasos**:
1. Abrir app en navegador: `http://localhost:8100`
2. Ir a tab "Estados"
3. Crear Registro 1:
   - Nombre: "Reunión de Trabajo"
   - Estado: Confirmado
   - Inicio: Hoy 14:00
   - Fin: Hoy 15:00
4. Crear Registro 2 (solapado):
   - Nombre: "Gimnasio"
   - Estado: Confirmado
   - Inicio: Hoy 14:30
   - Fin: Hoy 15:30

**Resultado esperado**:
- ✅ "Gimnasio" se guarda con estado "En Estudio" automáticamente
- ✅ Badge amarillo en tab "En Estudio" muestra contador +1

---

### Test Manual 2: Visualización de Buffers
**Objetivo**: Verificar franjas semitransparentes de buffers

**Pasos**:
1. Usar consola del navegador para crear registro con buffers:
```javascript
// Pegar en consola del navegador
const registroConBuffers = {
  id: crypto.randomUUID(),
  profileId: 'default',
  name: 'Clase Universidad',
  status: 'confirmado',
  priority: 'hard',
  startTime: new Date('2025-12-28T10:00:00'),
  endTime: new Date('2025-12-28T12:00:00'),
  bufferBefore: {
    duration: 30,
    description: 'Tránsito al campus'
  },
  bufferAfter: {
    duration: 15,
    description: 'Café con compañeros'
  },
  isAllDay: false,
  createdAt: new Date(),
  updatedAt: new Date()
};

// Obtener servicio y agregar
const agendaService = document.querySelector('app-home').__ngContext__[8];
agendaService.addRegistro(registroConBuffers);
```

2. Verificar en grid de registros

**Resultado esperado**:
- ✅ Franja azul ANTES del registro (30 min, "Tránsito al campus")
- ✅ Franja verde DESPUÉS del registro (15 min, "Café con compañeros")
- ✅ Hover sobre franjas muestra efecto visual

---

### Test Manual 3: Sin Conflicto
**Objetivo**: Verificar que registros separados NO generan conflicto

**Pasos**:
1. Crear Registro 1:
   - Nombre: "Desayuno"
   - Inicio: Hoy 08:00
   - Fin: Hoy 09:00
2. Crear Registro 2:
   - Nombre: "Almuerzo"
   - Inicio: Hoy 13:00
   - Fin: Hoy 14:00

**Resultado esperado**:
- ✅ Ambos registros se guardan con estado "Confirmado"
- ✅ NO aparecen en tab "En Estudio"

---

## Checklist de Verificación

### Funcionalidad Core
- [ ] Tests unitarios pasan (6/6)
- [ ] App inicia sin errores en consola
- [ ] Detección de conflictos funciona
- [ ] Marcado automático "En Estudio" funciona
- [ ] Buffers se visualizan correctamente

### UX/Visual
- [ ] Franjas de buffers tienen colores correctos
- [ ] Altura de franjas es proporcional a duración
- [ ] Grid de registros no tiene overflow
- [ ] Responsive en móvil (opcional)

### Rendimiento
- [ ] No hay warnings en consola
- [ ] Build compiló sin errores
- [ ] App carga en <3 segundos

---

## Resultados

**Fecha**: 28 de diciembre de 2025  
**Ejecutado por**: (Pendiente - pruebas automatizadas + manuales)

### Tests Unitarios
- Estado: ⏳ Pendiente verificación
- Cobertura: 6 casos

### Tests Manuales
- Test 1 (Conflicto): ⏳ Pendiente
- Test 2 (Buffers): ⏳ Pendiente
- Test 3 (Sin conflicto): ⏳ Pendiente
