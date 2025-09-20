# BSync Chrome Extension - TypeScript Version

## Estructura del Proyecto

```
bsync/chrome/
├── src/                       # Código fuente TypeScript
│   ├── popup.ts              # Controlador principal
│   ├── background.ts         # Script de fondo para auto-sync
│   ├── global.d.ts           # Declaraciones globales
│   ├── types/                # Definiciones de tipos
│   │   ├── index.ts          # Exportaciones de tipos
│   │   ├── storage.ts        # Tipos de almacenamiento
│   │   ├── tab.ts            # Tipos de pestañas
│   │   └── options.ts        # Tipos de opciones
│   └── modules/              # Módulos separados
│       ├── session-manager.ts    # Gestión de sesiones
│       ├── options-manager.ts    # Gestión de opciones
│       ├── tab-manager.ts        # Gestión de pestañas
│       ├── ui-manager.ts         # Gestión de interfaz
│       ├── storage-manager.ts    # Gestión de almacenamiento (Strategy Pattern)
│       └── storage-providers/    # Proveedores de almacenamiento
│           ├── base-storage-provider.ts    # Interfaz base
│           ├── google-drive-provider.ts    # Implementación Google Drive
│           └── bsync-server-provider.ts    # Implementación Servidor BSync
├── dist/                     # Código JavaScript compilado
├── popup.html                # Interfaz principal
├── popup.css                 # Estilos CSS
├── google-drive.js           # API de Google Drive
├── manifest.json             # Configuración de la extensión
├── default_icon.png          # Icono de la extensión
├── package.json              # Dependencias y scripts
├── tsconfig.json             # Configuración de TypeScript
├── start-dev.sh              # Script de desarrollo
└── README.md                 # Documentación
```

## Arquitectura Modular

### 1. **PopupController** (`popup.js`)
- **Responsabilidad**: Coordinador principal de la aplicación
- **Funciones**:
  - Inicialización de módulos
  - Manejo de eventos
  - Coordinación entre módulos

### 2. **SessionManager** (`modules/session-manager.js`)
- **Responsabilidad**: Gestión de sesiones múltiples
- **Funciones**:
  - Crear/eliminar sesiones
  - Cambiar entre sesiones
  - Persistencia en Google Drive

### 3. **OptionsManager** (`modules/options-manager.js`)
- **Responsabilidad**: Gestión de opciones de configuración
- **Funciones**:
  - Cargar/guardar opciones
  - Actualizar configuraciones
  - Persistencia en Chrome Storage

### 4. **TabManager** (`modules/tab-manager.js`)
- **Responsabilidad**: Operaciones con pestañas
- **Funciones**:
  - Obtener datos de pestañas
  - Restaurar pestañas
  - Manejar grupos de pestañas

### 5. **UIManager** (`modules/ui-manager.js`)
- **Responsabilidad**: Gestión de la interfaz de usuario
- **Funciones**:
  - Actualizar elementos UI
  - Manejar estados de carga
  - Mostrar mensajes

### 6. **StorageManager** (`modules/storage-manager.js`)
- **Responsabilidad**: Gestión de almacenamiento usando Strategy Pattern
- **Funciones**:
  - Delegar operaciones al proveedor actual
  - Cambiar entre proveedores dinámicamente
  - Configurar proveedores específicos
  - API unificada para todos los proveedores

### 7. **Storage Providers** (`modules/storage-providers/`)
- **BaseStorageProvider**: Interfaz base que define el contrato
- **GoogleDriveProvider**: Implementación para Google Drive
- **BSyncServerProvider**: Implementación para Servidor BSync
- **Patrón Strategy**: Cada proveedor encapsula su lógica específica

## Ventajas de la Refactorización

### ✅ **Separación de Responsabilidades**
- Cada módulo tiene una responsabilidad específica
- Código más fácil de entender y mantener

### ✅ **Reutilización**
- Los módulos pueden ser reutilizados en otras partes
- Fácil de extender con nuevas funcionalidades

### ✅ **Testabilidad**
- Cada módulo puede ser probado independientemente
- Mejor cobertura de pruebas

### ✅ **Mantenibilidad**
- Cambios en un módulo no afectan otros
- Debugging más fácil

### ✅ **Escalabilidad**
- Fácil agregar nuevos módulos
- Estructura preparada para crecimiento

### ✅ **Strategy Pattern Benefits**
- **Extensibilidad**: Agregar nuevos proveedores sin modificar código existente
- **Mantenibilidad**: Cada proveedor es independiente y fácil de mantener
- **Testabilidad**: Cada proveedor puede ser probado por separado
- **Flexibilidad**: Cambiar entre proveedores en tiempo de ejecución
- **Principio Abierto/Cerrado**: Abierto para extensión, cerrado para modificación

## Opciones de Almacenamiento

### 🗂️ **Google Drive** (Por defecto)
- **Ventajas**: Acceso desde cualquier dispositivo, sincronización automática
- **Configuración**: Requiere autenticación OAuth2
- **Uso**: Ideal para uso personal y sincronización entre dispositivos

### 🖥️ **Servidor BSync**
- **Ventajas**: Control total, sin límites de API, ideal para equipos
- **Configuración**: URL del servidor y ID de cuenta
- **Uso**: Ideal para uso empresarial o cuando se necesita control total

### ⚙️ **Configuración**
1. **Acceder a opciones**: Expandir la sección "⚙️ Opciones"
2. **Seleccionar tipo**: Elegir entre "Google Drive" o "Servidor BSync"
3. **Configurar servidor** (solo para BSync):
   - URL del servidor: `http://localhost:2544`
   - ID de cuenta: `default-user`

## Desarrollo con TypeScript

### 🚀 **Inicio Rápido**
```bash
# Instalar dependencias
npm install

# Iniciar desarrollo (compilación automática)
./start-dev.sh

# O manualmente:
npm run dev
```

### 🔧 **Scripts Disponibles**
```bash
npm run dev          # Compilación en modo watch
npm run build        # Compilación única
npm run clean        # Limpiar archivos compilados
npm run type-check   # Verificar tipos sin compilar
```

### 📝 **Flujo de Desarrollo**
1. **Editar código TypeScript** en `src/`
2. **TypeScript compila automáticamente** a `dist/`
3. **Recargar extensión** en Chrome
4. **¡Listo!** 🎉

### 🎯 **Ventajas de TypeScript**
- **Tipado estático**: Detecta errores en tiempo de compilación
- **IntelliSense**: Autocompletado mejorado
- **Refactoring seguro**: Cambios de código más seguros
- **Interfaces explícitas**: Contratos claros entre módulos
- **Mejor mantenibilidad**: Código autodocumentado

## Cómo Usar

### Para Desarrollo
1. **Editar módulos específicos**: Cada funcionalidad está en su propio archivo TypeScript
2. **Agregar nuevas funcionalidades**: Crear nuevos módulos siguiendo el patrón
3. **Modificar UI**: Solo editar `UIManager` y CSS
4. **Tipos seguros**: TypeScript te ayudará con autocompletado y detección de errores

### Para Extensión
1. **Nuevo módulo**: Crear archivo `.ts` en `src/modules/`
2. **Definir tipos**: Agregar interfaces en `src/types/`
3. **Importar**: Agregar import en `popup.ts`
4. **Integrar**: Usar en `PopupController`

## Patrones de Diseño

### **Strategy Pattern** (Storage Providers)
```javascript
// Interfaz base
class BaseStorageProvider {
    async saveData(filename, data) {
        throw new Error('saveData() method must be implemented');
    }
}

// Implementaciones específicas
class GoogleDriveProvider extends BaseStorageProvider {
    async saveData(filename, data) {
        return await this.driveAPI.saveToDrive(filename, data);
    }
}

class BSyncServerProvider extends BaseStorageProvider {
    async saveData(sessionId, data) {
        return await this.saveToBSyncServer(sessionId, data);
    }
}

// Contexto que usa la estrategia
class StorageManager {
    setStorageType(type) {
        this.currentProvider = this.providers[type];
    }
    
    async saveData(filename, data) {
        return await this.currentProvider.saveData(filename, data);
    }
}
```

### **Dependency Injection**
```javascript
class PopupController {
    constructor() {
        this.storageManager = new StorageManager();
        this.ui = new UIManager();
        this.optionsManager = new OptionsManager();
        this.sessionManager = new SessionManager(this.storageManager);
        this.tabManager = new TabManager(this.optionsManager);
    }
}
```

### **Event-Driven Architecture**
- Los módulos se comunican a través de eventos
- Bajo acoplamiento entre componentes

### **Single Responsibility Principle**
- Cada clase tiene una sola responsabilidad
- Métodos pequeños y enfocados

## Migración

### De Código Original a Refactorizado
1. **Funcionalidad**: 100% compatible
2. **Interfaz**: Sin cambios visibles
3. **Datos**: Se mantienen todas las configuraciones

### Archivos Actuales
- `popup.js`: Controlador principal modular
- `modules/`: Carpeta con todos los módulos especializados

## Próximos Pasos

### Mejoras Posibles
1. **TypeScript**: Agregar tipado estático
2. **Testing**: Agregar pruebas unitarias
3. **Documentación**: JSDoc para métodos
4. **Error Handling**: Manejo de errores más robusto

### Nuevas Funcionalidades
1. **Backup/Restore**: Exportar/importar configuraciones
2. **Sync History**: Historial de sincronizaciones
3. **Advanced Filters**: Filtros avanzados para pestañas
4. **Cloud Providers**: Soporte para otros servicios

---

**Nota**: Esta refactorización mantiene toda la funcionalidad existente mientras mejora significativamente la estructura del código.
