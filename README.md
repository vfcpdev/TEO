# ClassApp 📚

> Sistema de Gestión Académica para Docentes Universitarios

[![Ionic](https://img.shields.io/badge/Ionic-7+-3880FF?logo=ionic)](https://ionicframework.com/)
[![Angular](https://img.shields.io/badge/Angular-17+-DD0031?logo=angular)](https://angular.io/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5+-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Firebase](https://img.shields.io/badge/Firebase-Latest-FFCA28?logo=firebase)](https://firebase.google.com/)

## 🎯 Descripción

ClassApp es una aplicación multiplataforma diseñada para facilitar la gestión académica diaria de docentes universitarios que trabajan en múltiples instituciones educativas. Permite llevar un registro completo de actividades académicas de manera eficiente tanto online como offline.

### Funcionalidades Principales

- ✅ **Gestión de Instituciones**: Administra múltiples universidades donde trabajas
- 📖 **Gestión de Cursos**: Organiza cursos con horarios, aulas y modalidades
- 👥 **Importación CSV**: Carga masiva de estudiantes mediante archivos CSV
- 📋 **Registro de Asistencia**: Control rápido de asistencia por sesión
- 🎁 **Sistema de Bonificaciones**: Asigna puntos extras a estudiantes destacados
- 📝 **Seguimiento de Temas**: Documenta contenidos impartidos por clase
- 📅 **Calendario Académico**: Visualiza y organiza tu horario de clases
- 🔄 **Modo Offline**: Funcionalidad completa sin conexión a internet

## 🚀 Inicio Rápido

### Requisitos Previos

- Node.js 18+ y npm
- Ionic CLI: `npm install -g @ionic/cli`
- Android Studio (para desarrollo Android)
- Xcode (para desarrollo iOS, solo macOS)

### Instalación

```bash
# Clonar el repositorio
git clone https://github.com/tu-usuario/classapp.git
cd classapp

# Instalar dependencias
npm install

# Configurar Firebase
# Editar src/environments/environment.ts con tus credenciales de Firebase

# Iniciar servidor de desarrollo
ionic serve
```

La aplicación estará disponible en `http://localhost:8100`

## 🔧 Configuración de Firebase

1. Crea un proyecto en [Firebase Console](https://console.firebase.google.com/)
2. Habilita **Authentication** (Email/Password)
3. Crea una base de datos **Firestore**
4. Copia las credenciales de configuración
5. Actualiza [src/environments/environment.ts](src/environments/environment.ts):

```typescript
export const environment = {
  production: false,
  firebase: {
    apiKey: 'TU_API_KEY',
    authDomain: 'TU_AUTH_DOMAIN',
    projectId: 'TU_PROJECT_ID',
    storageBucket: 'TU_STORAGE_BUCKET',
    messagingSenderId: 'TU_MESSAGING_SENDER_ID',
    appId: 'TU_APP_ID'
  }
};
```

## 📱 Desarrollo por Plataforma

### Web
```bash
ionic serve
```

### Android
```bash
# Primera vez: agregar plataforma
ionic cap add android

# Sincronizar cambios
ionic cap sync android

# Ejecutar en dispositivo/emulador
ionic cap run android
```

### iOS
```bash
# Primera vez: agregar plataforma (solo macOS)
ionic cap add ios

# Sincronizar cambios
ionic cap sync ios

# Abrir en Xcode
ionic cap open ios
```

## 🏗️ Arquitectura del Proyecto

```
src/app/
├── core/                   # Servicios singleton (auth, storage, sync)
│   ├── services/
│   │   ├── auth.service.ts
│   │   ├── toast.service.ts
│   │   └── logger.service.ts
│   └── guards/
│       └── auth.guard.ts
├── shared/                 # Componentes, pipes, directivas compartidas
│   ├── components/
│   ├── pipes/
│   ├── directives/
│   └── constants/
├── features/               # Módulos de funcionalidad
│   ├── places/             # Gestión de lugares (universidades/instituciones)
│   ├── courses/            # Gestión de cursos
│   ├── students/           # Gestión de estudiantes (con CSV import)
│   ├── attendance/         # Control de asistencia
│   ├── bonus/              # Sistema de bonificaciones
│   ├── topics/             # Seguimiento de temas
│   └── calendar/           # Calendario académico
├── data/                   # Repositorios y modelos de datos
│   └── repositories/
│       ├── base.repository.ts
│       ├── place.repository.ts
│       ├── course.repository.ts
│       ├── student.repository.ts
│       ├── attendance.repository.ts
│       ├── bonus.repository.ts
│       └── topic.repository.ts
└── models/                 # Interfaces y tipos TypeScript
    ├── place.model.ts
    ├── course.model.ts
    ├── student.model.ts
    ├── attendance.model.ts
    ├── bonus.model.ts
    ├── topic.model.ts
    └── user.model.ts
```

## 🛠️ Stack Tecnológico

- **Frontend Framework**: Angular 17+ (Standalone Components)
- **Mobile Framework**: Ionic 7+ con Capacitor
- **UI Components**: Ionic Components
- **State Management**: Angular Signals
- **Forms**: Reactive Forms
- **Backend**: Firebase (Firestore + Auth)
- **Local Storage**: SQLite (móvil), IndexedDB (web)
- **Testing**: Jasmine, Karma, Cypress

## 📊 Modelo de Datos

Entidades principales:

- **Place**: Lugares de trabajo (universidades/instituciones educativas)
- **Course**: Cursos con horarios y modalidad (presencial/virtual)
- **Student**: Estudiantes con código único por curso
- **Attendance**: Registro de asistencia por sesión
- **Bonus**: Bonificaciones otorgadas a estudiantes
- **Topic**: Temas/contenidos impartidos por clase

Ver [docs/SRS.md](docs/SRS.md#6-modelo-de-datos-preliminar) para el modelo completo.

## 🧪 Testing

```bash
# Unit tests
npm test

# E2E tests
npm run test:e2e

# Coverage report
npm run test:coverage
```

## 📝 Scripts Disponibles

```bash
npm start              # Iniciar dev server
npm test               # Ejecutar unit tests
npm run build          # Build de producción
npm run lint           # Ejecutar linter
```

## 📖 Documentación

- **[SRS (Software Requirements Specification)](docs/SRS.md)**: Especificación completa de requisitos
- **[GitHub Copilot Instructions](.github/copilot-instructions.md)**: Guía para desarrollo asistido por IA
- **[Ionic Documentation](https://ionicframework.com/docs)**
- **[Angular Documentation](https://angular.dev)**
- **[Firebase Documentation](https://firebase.google.com/docs)**

## 🎨 Convenciones de Código

- Usar **Standalone Components** para nueva funcionalidad
- Preferir **Angular Signals** sobre RxJS para estado local
- Implementar **Repository Pattern** para acceso a datos
- Seguir guía de estilo de Angular y Ionic
- Cobertura de tests >70%

Ver [.github/copilot-instructions.md](.github/copilot-instructions.md) para detalles completos.

## 🔐 Seguridad

- Autenticación con Firebase Authentication
- Validación de datos en cliente y servidor
- Reglas de seguridad de Firestore
- Sesiones con timeout automático

## 🌐 Soporte de Plataformas

| Plataforma | Versión Mínima | Estado |
|------------|----------------|--------|
| iOS        | 13.0+          | ✅ Planeado |
| Android    | 8.0+           | ✅ Planeado |
| Web        | Navegadores modernos | ✅ Desarrollo |

## 📦 Build de Producción

```bash
# Web
ionic build --prod

# Android APK
ionic cap build android --prod

# iOS (requiere Xcode)
ionic cap build ios --prod
```

## 🗺️ Roadmap

### ✅ Fase 0 - Estructura Base (Completado)
- [x] Proyecto Ionic + Angular inicializado
- [x] Modelos TypeScript creados
- [x] Firebase configurado
- [x] Repositorios base implementados
- [x] Documentación SRS

### Fase 1 - MVP (En progreso)
- [ ] Autenticación completa
- [ ] Gestión de instituciones (CRUD)
- [ ] Gestión de cursos (CRUD)
- [ ] Importación CSV de estudiantes
- [ ] Registro de asistencia
- [ ] Calendario básico

### Fase 2 - Core Features
- [ ] Sistema de bonificaciones
- [ ] Seguimiento de temas
- [ ] Estadísticas de asistencia
- [ ] Exportación de datos
- [ ] Sincronización en la nube

### Fase 3 - Optimización
- [ ] Modo offline completo
- [ ] Notificaciones push
- [ ] Reportes avanzados
- [ ] Mejoras de UI/UX
- [ ] Testing exhaustivo

### Futuro
- [ ] Gestión de calificaciones
- [ ] Comunicación con estudiantes
- [ ] Integración con LMS
- [ ] Analytics avanzados

## 📄 Licencia

Este proyecto es privado y propietario.

## 👨‍💻 Autor

**ClassApp Team**

---

**Versión**: 1.0.0  
**Última actualización**: 13 de diciembre de 2025
