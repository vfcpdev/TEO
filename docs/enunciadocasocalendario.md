# Enunciado: Caso de Estudio - Visibilidad del Calendario en Modal Ionic

## Objetivo
Implementar un control `ion-datetime` dentro de un `ion-modal` en una aplicación Ionic/Angular, donde el calendario muestre correctamente:
- Todos los días del mes visible
- Festivos colombianos destacados con círculo rojo
- Día actual con borde verde
- Botones personalizados de Aceptar y Cancelar

---

## Descripción del Problema

### Síntomas Observados
Al abrir el modal con el calendario (`ion-datetime`), los días del calendario **no eran visibles**. El modal se abría correctamente, mostrando:
- ✅ Título "Seleccionar Fecha"
- ✅ Botones de Aceptar/Cancelar en el footer
- ❌ Área blanca vacía donde deberían estar los días

### Diagnóstico Técnico
Usando DevTools del navegador, se confirmó que:
- Los elementos `.calendar-day` **existían en el DOM** dentro del Shadow DOM de `ion-datetime`
- Los elementos tenían las dimensiones correctas (42x42px)
- El color del texto era correcto (`#1f2937` - gris oscuro)
- Sin embargo, estaban posicionados **fuera del área visible** del modal

### Causa Raíz Identificada

> **El modal tenía altura insuficiente que cortaba el contenido de ion-datetime.**

El problema se originó por:

1. **Altura del modal colapsada**: Cuando se usaba `--height: auto` o valores insuficientes, el modal colapsaba a una altura mínima (~100px), insuficiente para mostrar el calendario completo (~400px necesarios).

2. **Estilos en archivo incorrecto**: Los estilos del modal estaban en el archivo SCSS del componente (`home.page.scss`), pero según la [documentación de Ionic](https://ionicframework.com/docs/api/modal#styling), **los modales se renderizan en la raíz de la aplicación**, fuera del DOM del componente, por lo que los estilos encapsulados no los afectan.

3. **CSS Shadow DOM**: `ion-datetime` usa Shadow DOM, lo que significa que sus elementos internos (`.calendar-day`, `.calendar-header`, etc.) no son accesibles con selectores CSS normales.

---

## Solución Implementada

### 1. Mover estilos a `global.scss`

Los estilos del modal **deben ser globales** para que apliquen correctamente:

```scss
// src/global.scss

ion-modal.calendar-modal {
  // Altura fija suficiente para el calendario completo
  --height: 600px;
  --min-height: 600px;
  
  // Ancho responsivo
  --width: 100%;

  @media (min-width: 768px) {
    --width: 420px;
    --border-radius: 16px;
  }

  // ion-datetime necesita altura suficiente
  ion-datetime {
    min-height: 450px;
    height: 450px;
  }
}

// Iconos del footer
ion-modal.calendar-modal ion-footer ion-button ion-icon {
  font-size: 28px;
}
```

### 2. Estructura HTML del Modal

Usar la estructura recomendada por Ionic con `ng-template`:

```html
<ion-modal [isOpen]="isCalendarModalOpen()" 
           (didDismiss)="cancelDateSelection()" 
           class="calendar-modal">
  <ng-template>
    <ion-header>
      <ion-toolbar>
        <ion-title>Seleccionar Fecha</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <ion-datetime 
        presentation="date" 
        [highlightedDates]="highlightedDates" 
        [value]="calendarInitialValue"
        (ionChange)="onCalendarDateSelect($event)" 
        [showDefaultButtons]="false" 
        locale="es-ES" 
        mode="md">
      </ion-datetime>
    </ion-content>

    <ion-footer>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button (click)="cancelDateSelection()">
            <ion-icon slot="icon-only" name="close-circle" color="warning"></ion-icon>
          </ion-button>
        </ion-buttons>
        <ion-buttons slot="end">
          <ion-button (click)="confirmDateSelection()">
            <ion-icon slot="icon-only" name="checkmark-circle" color="success"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-footer>
  </ng-template>
</ion-modal>
```

### 3. Atributos clave de ion-datetime

| Atributo | Valor | Propósito |
|----------|-------|-----------|
| `presentation` | `"date"` | Solo selección de fecha (sin hora) |
| `locale` | `"es-ES"` | Formato español para nombres de meses y días |
| `mode` | `"md"` | Forzar estilo Material Design (más compatible) |
| `[showDefaultButtons]` | `false` | Ocultar botones por defecto (usamos personalizados) |
| `[highlightedDates]` | Función | Para destacar festivos con estilos personalizados |

---

## Guía de Implementación Paso a Paso

### Paso 1: Crear el modal en el HTML del componente

```html
<!-- En tu componente .html -->
<ion-modal [isOpen]="isModalOpen" class="calendar-modal">
  <ng-template>
    <ion-header>
      <ion-toolbar>
        <ion-title>Seleccionar Fecha</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <ion-datetime 
        presentation="date"
        locale="es-ES"
        mode="md">
      </ion-datetime>
    </ion-content>

    <ion-footer>
      <ion-toolbar>
        <!-- Tus botones aquí -->
      </ion-toolbar>
    </ion-footer>
  </ng-template>
</ion-modal>
```

### Paso 2: Agregar estilos globales (OBLIGATORIO)

En `src/global.scss`, agregar:

```scss
ion-modal.calendar-modal {
  --height: 600px;
  --min-height: 600px;
  --width: 100%;

  @media (min-width: 768px) {
    --width: 420px;
    --border-radius: 16px;
  }

  ion-datetime {
    min-height: 450px;
    height: 450px;
  }
}
```

### Paso 3: Importar componentes necesarios en el TypeScript

```typescript
// En tu .component.ts
import { 
  IonModal, 
  IonDatetime, 
  IonHeader, 
  IonToolbar, 
  IonTitle, 
  IonContent, 
  IonFooter,
  IonButtons,
  IonButton,
  IonIcon 
} from '@ionic/angular/standalone';

@Component({
  imports: [
    IonModal,
    IonDatetime,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonFooter,
    IonButtons,
    IonButton,
    IonIcon,
    // ... otros imports
  ]
})
```

### Paso 4: Registrar iconos si usas iconos personalizados

```typescript
import { addIcons } from 'ionicons';
import { closeCircle, checkmarkCircle } from 'ionicons/icons';

constructor() {
  addIcons({ closeCircle, checkmarkCircle });
}
```

---

## Errores Comunes a Evitar

| Error | Consecuencia | Solución |
|-------|--------------|----------|
| Estilos en SCSS del componente | Modal no recibe estilos | Usar `global.scss` |
| `--height: auto` en modal | Calendario cortado | Usar altura fija (600px) |
| No definir altura de `ion-datetime` | Calendario comprimido | Establecer `min-height: 450px` |
| Olvidar `ng-template` | Modal no renderiza contenido | Envolver contenido en `<ng-template>` |
| Falta `IonFooter` en imports | Error de compilación | Agregar a imports del componente |

---

## Verificación

Después de implementar, verificar:

1. **Abrir el modal** - Debe mostrar el calendario completo
2. **Días visibles** - Números del 1 al 31 deben verse claramente
3. **Navegación** - Flechas para cambiar de mes deben funcionar
4. **Festivos** - Días configurados deben tener círculo rojo
5. **Día actual** - Debe tener borde verde/primario
6. **Botones** - Aceptar y Cancelar deben funcionar

---

## Referencias

- [Ionic Modal Documentation](https://ionicframework.com/docs/api/modal)
- [Ionic Datetime Documentation](https://ionicframework.com/docs/api/datetime)
- [Angular Component Styling](https://angular.dev/guide/components/styling)
