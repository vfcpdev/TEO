import { Injectable, signal } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

const DATABASE_NAME = 'classapp_db';
const DATABASE_VERSION = 2; // Incrementado para incluir perfiles y registros
const EXPORT_FILENAME = 'classapp_backup.json';

/**
 * Esquema de la base de datos SQLite
 */
const DB_SCHEMA = `
  CREATE TABLE IF NOT EXISTS places (
    id TEXT PRIMARY KEY NOT NULL,
    code TEXT,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('W', 'P')),
    latitude REAL,
    longitude REAL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_places_type ON places(type);
  CREATE INDEX IF NOT EXISTS idx_places_code ON places(code);

  CREATE TABLE IF NOT EXISTS courses (
    id TEXT PRIMARY KEY NOT NULL,
    code TEXT NOT NULL,
    group_number INTEGER,
    semester TEXT,
    name TEXT NOT NULL,
    place_id TEXT NOT NULL,
    classroom TEXT,
    modality TEXT NOT NULL CHECK(modality IN ('presencial', 'virtual')),
    virtual_link TEXT,
    academic_period TEXT,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (place_id) REFERENCES places(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_courses_place_id ON courses(place_id);
  CREATE INDEX IF NOT EXISTS idx_courses_code ON courses(code);
  CREATE INDEX IF NOT EXISTS idx_courses_is_active ON courses(is_active);

  CREATE TABLE IF NOT EXISTS course_schedules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    course_id TEXT NOT NULL,
    day INTEGER NOT NULL CHECK(day >= 0 AND day <= 6),
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_schedules_course_id ON course_schedules(course_id);
  CREATE INDEX IF NOT EXISTS idx_schedules_day ON course_schedules(day);

  CREATE TABLE IF NOT EXISTS students (
    id TEXT PRIMARY KEY NOT NULL,
    code TEXT NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_students_code ON students(code);

  CREATE TABLE IF NOT EXISTS course_students (
    course_id TEXT NOT NULL,
    student_id TEXT NOT NULL,
    enrolled_at TEXT NOT NULL,
    PRIMARY KEY (course_id, student_id),
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS attendance (
    id TEXT PRIMARY KEY NOT NULL,
    course_id TEXT NOT NULL,
    student_id TEXT NOT NULL,
    session_date TEXT NOT NULL,
    status TEXT NOT NULL CHECK(status IN ('presente', 'ausente', 'tardanza', 'justificado')),
    notes TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    UNIQUE(course_id, student_id, session_date)
  );

  CREATE INDEX IF NOT EXISTS idx_attendance_course ON attendance(course_id);
  CREATE INDEX IF NOT EXISTS idx_attendance_student ON attendance(student_id);
  CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(session_date);

  CREATE TABLE IF NOT EXISTS bonus (
    id TEXT PRIMARY KEY NOT NULL,
    student_id TEXT NOT NULL,
    course_id TEXT NOT NULL,
    points INTEGER NOT NULL,
    reason TEXT NOT NULL,
    category TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_bonus_student ON bonus(student_id);
  CREATE INDEX IF NOT EXISTS idx_bonus_course ON bonus(course_id);

  CREATE TABLE IF NOT EXISTS topics (
    id TEXT PRIMARY KEY NOT NULL,
    course_id TEXT NOT NULL,
    session_date TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_topics_course ON topics(course_id);
  CREATE INDEX IF NOT EXISTS idx_topics_date ON topics(session_date);

  CREATE TABLE IF NOT EXISTS sync_queue (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    operation TEXT NOT NULL CHECK(operation IN ('create', 'update', 'delete')),
    data TEXT,
    created_at TEXT NOT NULL,
    synced INTEGER DEFAULT 0
  );

  CREATE INDEX IF NOT EXISTS idx_sync_queue_synced ON sync_queue(synced);

  CREATE TABLE IF NOT EXISTS app_settings (
    key TEXT PRIMARY KEY NOT NULL,
    value TEXT NOT NULL
  );

  -- TABLAS PARA PERFILES Y REGISTROS (V2)
  CREATE TABLE IF NOT EXISTS profiles (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    alias TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('padre', 'madre', 'hijo', 'hija', 'otro')),
    avatar TEXT,
    is_primary INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS registros (
    id TEXT PRIMARY KEY NOT NULL,
    profile_id TEXT NOT NULL,
    name TEXT NOT NULL,
    area_id TEXT,
    contexto_id TEXT,
    tipo_id TEXT,
    status TEXT NOT NULL DEFAULT 'borrador' CHECK(status IN ('confirmado', 'borrador', 'estudio', 'descartado', 'aplazado')),
    priority TEXT DEFAULT 'soft' CHECK(priority IN ('hard', 'soft')),
    start_time TEXT,
    end_time TEXT,
    is_all_day INTEGER DEFAULT 0,
    notes TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_registros_profile ON registros(profile_id);
  CREATE INDEX IF NOT EXISTS idx_registros_status ON registros(status);
  CREATE INDEX IF NOT EXISTS idx_registros_time ON registros(start_time);

  CREATE TABLE IF NOT EXISTS registro_tasks (
    id TEXT PRIMARY KEY NOT NULL,
    registro_id TEXT NOT NULL,
    name TEXT NOT NULL,
    completed INTEGER DEFAULT 0,
    area_id TEXT,
    contexto_id TEXT,
    FOREIGN KEY (registro_id) REFERENCES registros(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_tasks_registro ON registro_tasks(registro_id);
`;

export interface QueryResult<T = any> {
  values?: T[];
  changes?: { changes: number; lastId: number };
}

/**
 * Servicio SQLite para almacenamiento local persistente
 * Soporta Web (via jeep-sqlite), Android e iOS
 */
@Injectable({
  providedIn: 'root'
})
export class SQLiteService {
  private sqliteConnection: SQLiteConnection | null = null;
  private db: SQLiteDBConnection | null = null;
  private platform = Capacitor.getPlatform();

  readonly isReady = signal(false);
  readonly isWeb = this.platform === 'web';

  constructor() {
    this.initializeDatabase();
  }

  /**
   * Inicializa la conexión a SQLite
   */
  async initializeDatabase(): Promise<void> {
    try {
      console.log(`[SQLite] Initializing on platform: ${this.platform}`);

      if (this.platform === 'web') {
        await this.initWebDatabase();
      } else {
        await this.initNativeDatabase();
      }

      // Crear esquema
      await this.executeSchema();

      this.isReady.set(true);
      console.log('[SQLite] Database ready');
    } catch (error) {
      console.error('[SQLite] Initialization error:', error);
      throw error;
    }
  }

  /**
   * Inicializa base de datos para web usando jeep-sqlite
   */
  private async initWebDatabase(): Promise<void> {
    console.log('[SQLite] Starting web database initialization...');

    // 1. Esperar a que el custom element esté definido
    await customElements.whenDefined('jeep-sqlite');
    console.log('[SQLite] jeep-sqlite custom element is defined');

    // 2. Buscar o crear el elemento jeep-sqlite
    let jeepSqlite = document.querySelector('jeep-sqlite') as any;
    if (!jeepSqlite) {
      console.log('[SQLite] Creating jeep-sqlite element...');
      jeepSqlite = document.createElement('jeep-sqlite');
      document.body.appendChild(jeepSqlite);
    }

    // 3. Inicializar el web store si no está inicializado
    try {
      const isStoreOpen = await jeepSqlite.isStoreOpen();
      console.log('[SQLite] Store open status:', isStoreOpen);
      if (!isStoreOpen) {
        await jeepSqlite.initWebStore();
        console.log('[SQLite] Web store initialized');
      }
    } catch (e) {
      // Si hay error, intentar inicializar de todas formas
      console.log('[SQLite] Attempting initWebStore...');
      await jeepSqlite.initWebStore();
      console.log('[SQLite] Web store initialized (fallback)');
    }

    // 4. Crear conexión SQLite
    this.sqliteConnection = new SQLiteConnection(CapacitorSQLite);

    // 5. Verificar consistencia del store
    const ret = await this.sqliteConnection.checkConnectionsConsistency();
    console.log('[SQLite] Connections consistency:', ret.result);

    // 6. Crear/abrir conexión a la base de datos
    this.db = await this.sqliteConnection.createConnection(
      DATABASE_NAME,
      false,
      'no-encryption',
      DATABASE_VERSION,
      false
    );

    await this.db.open();
    console.log('[SQLite] Database connection opened');
  }

  /**
   * Inicializa base de datos nativa (Android/iOS)
   */
  private async initNativeDatabase(): Promise<void> {
    this.sqliteConnection = new SQLiteConnection(CapacitorSQLite);

    // Verificar si la conexión ya existe
    const retCC = await this.sqliteConnection.checkConnectionsConsistency();
    const isConnected = (await this.sqliteConnection.isConnection(DATABASE_NAME, false)).result;

    if (retCC.result && isConnected) {
      this.db = await this.sqliteConnection.retrieveConnection(DATABASE_NAME, false);
    } else {
      this.db = await this.sqliteConnection.createConnection(
        DATABASE_NAME,
        false,
        'no-encryption',
        DATABASE_VERSION,
        false
      );
    }

    await this.db.open();
  }

  /**
   * Ejecuta el esquema de creación de tablas
   */
  private async executeSchema(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    // Habilitar foreign keys
    await this.db.execute('PRAGMA foreign_keys = ON;');

    // Ejecutar esquema
    await this.db.execute(DB_SCHEMA);

    console.log('[SQLite] Schema created successfully');
  }

  /**
   * Ejecuta una consulta SQL y retorna resultados
   */
  async query<T = any>(sql: string, values: any[] = []): Promise<T[]> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.query(sql, values);
    return (result.values || []) as T[];
  }

  /**
   * Ejecuta una sentencia SQL (INSERT, UPDATE, DELETE)
   */
  async run(sql: string, values: any[] = []): Promise<{ changes: number; lastId: number }> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.run(sql, values);

    // En web, guardar cambios a IndexedDB automáticamente
    await this.saveToStoreIfWeb();

    return {
      changes: result.changes?.changes || 0,
      lastId: result.changes?.lastId || 0
    };
  }

  /**
   * Ejecuta múltiples sentencias SQL en una transacción
   */
  async executeTransaction(statements: Array<{ sql: string; values?: any[] }>): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.execute('BEGIN TRANSACTION;');

    try {
      for (const stmt of statements) {
        await this.db.run(stmt.sql, stmt.values || []);
      }
      await this.db.execute('COMMIT;');

      // En web, guardar cambios a IndexedDB después de la transacción
      await this.saveToStoreIfWeb();
    } catch (error) {
      await this.db.execute('ROLLBACK;');
      throw error;
    }
  }

  /**
   * Guarda la base de datos a IndexedDB (solo en web)
   * Según la documentación, en web la BD está en memoria y debe
   * persistirse explícitamente a IndexedDB
   */
  async saveToStore(): Promise<void> {
    if (this.platform === 'web' && this.sqliteConnection) {
      await this.sqliteConnection.saveToStore(DATABASE_NAME);
    }
  }

  /**
   * Helper para guardar a store automáticamente si estamos en web
   */
  private async saveToStoreIfWeb(): Promise<void> {
    if (this.platform === 'web') {
      await this.saveToStore();
    }
  }

  /**
   * Inserta un registro y retorna el ID
   */
  async insert(table: string, data: Record<string, any>): Promise<string | number> {
    const columns = Object.keys(data);
    const placeholders = columns.map(() => '?').join(', ');
    const values = Object.values(data);

    const sql = `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`;
    const result = await this.run(sql, values);

    // Retornar el id proporcionado o el lastId generado
    return data['id'] || result.lastId;
  }

  /**
   * Actualiza registros
   */
  async update(table: string, data: Record<string, any>, where: string, whereValues: any[] = []): Promise<number> {
    const setClause = Object.keys(data).map(key => `${key} = ?`).join(', ');
    const values = [...Object.values(data), ...whereValues];

    const sql = `UPDATE ${table} SET ${setClause} WHERE ${where}`;
    const result = await this.run(sql, values);

    return result.changes;
  }

  /**
   * Elimina registros
   */
  async delete(table: string, where: string, whereValues: any[] = []): Promise<number> {
    const sql = `DELETE FROM ${table} WHERE ${where}`;
    const result = await this.run(sql, whereValues);

    return result.changes;
  }

  /**
   * Busca un registro por ID
   */
  async findById<T = any>(table: string, id: string | number): Promise<T | null> {
    const results = await this.query<T>(`SELECT * FROM ${table} WHERE id = ?`, [id]);
    return results.length > 0 ? results[0] : null;
  }

  /**
   * Obtiene todos los registros de una tabla
   */
  async findAll<T = any>(table: string, orderBy?: string): Promise<T[]> {
    let sql = `SELECT * FROM ${table}`;
    if (orderBy) sql += ` ORDER BY ${orderBy}`;
    return this.query<T>(sql);
  }

  /**
   * Cuenta registros en una tabla
   */
  async count(table: string, where?: string, whereValues?: any[]): Promise<number> {
    let sql = `SELECT COUNT(*) as count FROM ${table}`;
    if (where) sql += ` WHERE ${where}`;

    const result = await this.query<{ count: number }>(sql, whereValues);
    return result[0]?.count || 0;
  }

  /**
   * Verifica si existe un registro
   */
  async exists(table: string, where: string, whereValues: any[] = []): Promise<boolean> {
    const count = await this.count(table, where, whereValues);
    return count > 0;
  }

  /**
   * Guarda en la cola de sincronización
   */
  async queueForSync(entityType: string, entityId: string, operation: 'create' | 'update' | 'delete', data?: any): Promise<void> {
    await this.insert('sync_queue', {
      entity_type: entityType,
      entity_id: entityId,
      operation,
      data: data ? JSON.stringify(data) : null,
      created_at: new Date().toISOString(),
      synced: 0
    });
  }

  /**
   * Obtiene elementos pendientes de sincronización
   */
  async getPendingSyncItems(): Promise<any[]> {
    return this.query('SELECT * FROM sync_queue WHERE synced = 0 ORDER BY created_at ASC');
  }

  /**
   * Marca un elemento como sincronizado
   */
  async markAsSynced(id: number): Promise<void> {
    await this.update('sync_queue', { synced: 1 }, 'id = ?', [id]);
  }

  /**
   * Guarda configuración de la app
   */
  async setSetting(key: string, value: any): Promise<void> {
    const exists = await this.exists('app_settings', 'key = ?', [key]);
    const stringValue = JSON.stringify(value);

    if (exists) {
      await this.update('app_settings', { value: stringValue }, 'key = ?', [key]);
    } else {
      await this.insert('app_settings', { key, value: stringValue });
    }
  }

  /**
   * Obtiene configuración de la app
   */
  async getSetting<T = any>(key: string): Promise<T | null> {
    const result = await this.query<{ key: string; value: string }>('SELECT * FROM app_settings WHERE key = ?', [key]);
    if (result.length === 0) return null;

    try {
      return JSON.parse(result[0].value) as T;
    } catch {
      return result[0].value as unknown as T;
    }
  }

  /**
   * Cierra la conexión a la base de datos
   */
  async close(): Promise<void> {
    if (this.db) {
      await this.db.close();
      if (this.sqliteConnection) {
        await this.sqliteConnection.closeConnection(DATABASE_NAME, false);
      }
    }
  }

  /**
   * Elimina la base de datos (útil para testing o reset)
   */
  async deleteDatabase(): Promise<void> {
    if (this.sqliteConnection) {
      await this.close();
      // Nota: deleteOldDatabases elimina bases de datos antiguas
      // Para eliminar la actual, se debe recrear
      await CapacitorSQLite.deleteDatabase({ database: DATABASE_NAME });
    }
  }

  // ============================================================
  // IMPORT / EXPORT FUNCTIONALITY
  // ============================================================

  /**
   * Exporta toda la base de datos a un objeto JSON
   */
  async exportToJson(): Promise<DatabaseExport> {
    if (!this.db) throw new Error('Database not initialized');

    const tables = [
      'places',
      'courses',
      'course_schedules',
      'students',
      'course_students',
      'attendance',
      'bonus',
      'topics',
      'app_settings'
    ];

    const data: Record<string, any[]> = {};

    for (const table of tables) {
      try {
        data[table] = await this.query(`SELECT * FROM ${table}`);
      } catch (error) {
        console.warn(`[SQLite] Could not export table ${table}:`, error);
        data[table] = [];
      }
    }

    const exportData: DatabaseExport = {
      version: DATABASE_VERSION,
      exportedAt: new Date().toISOString(),
      platform: this.platform,
      appVersion: '1.5',
      tables: data
    };

    return exportData;
  }

  /**
   * Exporta la base de datos a un archivo JSON y lo comparte
   */
  async exportToFile(): Promise<{ success: boolean; filePath?: string; error?: string }> {
    try {
      const exportData = await this.exportToJson();
      const jsonString = JSON.stringify(exportData, null, 2);

      if (this.platform === 'web') {
        // En web, descargar como archivo
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = EXPORT_FILENAME;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        return { success: true, filePath: EXPORT_FILENAME };
      } else {
        // En móvil, guardar en Documents y compartir
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `classapp_backup_${timestamp}.json`;

        await Filesystem.writeFile({
          path: filename,
          data: jsonString,
          directory: Directory.Documents,
          encoding: Encoding.UTF8
        });

        // Obtener URI del archivo para compartir
        const fileUri = await Filesystem.getUri({
          path: filename,
          directory: Directory.Documents
        });

        // Ofrecer compartir el archivo
        await Share.share({
          title: 'Backup ClassApp',
          text: 'Copia de seguridad de ClassApp',
          url: fileUri.uri,
          dialogTitle: 'Exportar base de datos'
        });

        return { success: true, filePath: fileUri.uri };
      }
    } catch (error) {
      console.error('[SQLite] Export error:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Importa datos desde un objeto JSON a la base de datos
   */
  async importFromJson(data: DatabaseExport): Promise<ImportResult> {
    if (!this.db) throw new Error('Database not initialized');

    const result: ImportResult = {
      success: true,
      imported: {},
      errors: []
    };

    // Validar versión
    if (data.version > DATABASE_VERSION) {
      return {
        success: false,
        imported: {},
        errors: [`Versión de backup (${data.version}) es mayor que la versión actual (${DATABASE_VERSION})`]
      };
    }

    // Orden de importación respetando foreign keys
    const importOrder = [
      'places',
      'courses',
      'course_schedules',
      'students',
      'course_students',
      'attendance',
      'bonus',
      'topics',
      'app_settings'
    ];

    try {
      // Iniciar transacción
      await this.db.execute('BEGIN TRANSACTION;');

      // Limpiar tablas en orden inverso (por foreign keys)
      for (const table of [...importOrder].reverse()) {
        if (table !== 'app_settings') { // Preservar configuraciones
          await this.db.run(`DELETE FROM ${table}`);
        }
      }

      // Importar cada tabla
      for (const table of importOrder) {
        const records = data.tables[table] || [];
        result.imported[table] = 0;

        for (const record of records) {
          try {
            // Convertir el registro a columnas y valores
            const columns = Object.keys(record);
            const placeholders = columns.map(() => '?').join(', ');
            const values = columns.map(col => record[col]);

            const sql = `INSERT OR REPLACE INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`;
            await this.db.run(sql, values);
            result.imported[table]!++;
          } catch (recordError) {
            result.errors.push(`Error en ${table}: ${(recordError as Error).message}`);
          }
        }
      }

      await this.db.execute('COMMIT;');

      // Guardar a store si es web
      await this.saveToStoreIfWeb();

    } catch (error) {
      await this.db.execute('ROLLBACK;');
      result.success = false;
      result.errors.push(`Error de transacción: ${(error as Error).message}`);
    }

    return result;
  }

  /**
   * Importa desde un archivo JSON
   * En web: acepta un File object
   * En móvil: acepta una URI de archivo
   */
  async importFromFile(fileOrUri: File | string): Promise<ImportResult> {
    try {
      let jsonString: string;

      if (typeof fileOrUri === 'string') {
        // URI de archivo (móvil)
        const fileData = await Filesystem.readFile({
          path: fileOrUri,
          encoding: Encoding.UTF8
        });
        jsonString = fileData.data as string;
      } else {
        // File object (web)
        jsonString = await this.readFileAsText(fileOrUri);
      }

      const data = JSON.parse(jsonString) as DatabaseExport;

      // Validar estructura básica
      if (!data.version || !data.tables) {
        return {
          success: false,
          imported: {},
          errors: ['Archivo de backup inválido: estructura incorrecta']
        };
      }

      return await this.importFromJson(data);
    } catch (error) {
      return {
        success: false,
        imported: {},
        errors: [`Error al leer archivo: ${(error as Error).message}`]
      };
    }
  }

  /**
   * Helper para leer archivo como texto en web
   */
  private readFileAsText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsText(file);
    });
  }

  /**
   * Obtiene estadísticas de la base de datos
   */
  async getDatabaseStats(): Promise<DatabaseStats> {
    const stats: DatabaseStats = {
      totalRecords: 0,
      tables: {}
    };

    const tables = ['places', 'courses', 'students', 'attendance', 'bonus', 'topics'];

    for (const table of tables) {
      const count = await this.count(table);
      stats.tables[table] = count;
      stats.totalRecords += count;
    }

    stats.pendingSyncItems = await this.count('sync_queue', 'synced = 0');

    return stats;
  }
}

// ============================================================
// INTERFACES FOR IMPORT/EXPORT
// ============================================================

export interface DatabaseExport {
  version: number;
  exportedAt: string;
  platform: string;
  appVersion: string;
  tables: Record<string, any[]>;
}

export interface ImportResult {
  success: boolean;
  imported: Record<string, number>;
  errors: string[];
}

export interface DatabaseStats {
  totalRecords: number;
  tables: Record<string, number>;
  pendingSyncItems?: number;
}
