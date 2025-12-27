import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { FilePicker, PickFilesResult } from '@capawesome/capacitor-file-picker';

export interface PickedFile {
  name: string;
  path?: string;
  data?: string; // Base64 para nativo
  blob?: Blob;   // Blob para web
  mimeType?: string;
  size?: number;
}

/**
 * Servicio para seleccionar archivos de forma multiplataforma
 * Usa @capawesome/capacitor-file-picker en nativo y input file en web
 */
@Injectable({
  providedIn: 'root'
})
export class FilePickerService {
  private platform = Capacitor.getPlatform();

  constructor() { }

  /**
   * Seleccionar un archivo CSV
   */
  async pickCsvFile(): Promise<PickedFile | null> {
    return this.pickFile(['text/csv', 'text/comma-separated-values', 'application/csv', '.csv']);
  }

  /**
   * Seleccionar un archivo JSON
   */
  async pickJsonFile(): Promise<PickedFile | null> {
    return this.pickFile(['application/json', '.json']);
  }

  /**
   * Seleccionar archivo con tipos específicos
   */
  async pickFile(types: string[]): Promise<PickedFile | null> {
    if (this.platform === 'web') {
      return this.pickFileWeb(types);
    } else {
      return this.pickFileNative(types);
    }
  }

  /**
   * Selector de archivos para Web (usando input file)
   */
  private pickFileWeb(types: string[]): Promise<PickedFile | null> {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = types.join(',');

      input.onchange = async (event: Event) => {
        const file = (event.target as HTMLInputElement).files?.[0];
        if (!file) {
          resolve(null);
          return;
        }

        resolve({
          name: file.name,
          blob: file,
          mimeType: file.type,
          size: file.size
        });
      };

      // Si el usuario cancela
      input.oncancel = () => resolve(null);

      // Detectar cancelación con focus (fallback)
      const handleFocus = () => {
        setTimeout(() => {
          if (!input.files?.length) {
            resolve(null);
          }
          window.removeEventListener('focus', handleFocus);
        }, 300);
      };
      window.addEventListener('focus', handleFocus);

      input.click();
    });
  }

  /**
   * Selector de archivos para Android/iOS usando Capacitor File Picker
   */
  private async pickFileNative(types: string[]): Promise<PickedFile | null> {
    try {
      const result: PickFilesResult = await FilePicker.pickFiles({
        types: types,
        limit: 1, // Solo seleccionar un archivo
        readData: true // Leer el contenido en base64
      });

      if (!result.files || result.files.length === 0) {
        return null;
      }

      const file = result.files[0];

      return {
        name: file.name || 'archivo',
        path: file.path,
        data: file.data, // Base64
        mimeType: file.mimeType,
        size: file.size
      };
    } catch (error: any) {
      // El usuario canceló o hubo un error
      if (error?.message?.includes('cancel') || error?.message?.includes('Cancel')) {
        return null;
      }
      console.error('[FilePicker] Error picking file:', error);
      throw error;
    }
  }

  /**
   * Leer el contenido de un archivo seleccionado como texto
   */
  async readFileAsText(file: PickedFile): Promise<string> {
    if (file.blob) {
      // Web: leer desde Blob
      return file.blob.text();
    } else if (file.data) {
      // Nativo: decodificar base64
      return this.decodeBase64(file.data);
    }
    throw new Error('No se puede leer el archivo: sin datos');
  }

  /**
   * Decodificar base64 a texto UTF-8
   */
  private decodeBase64(base64: string): string {
    // Usar TextDecoder para mejor soporte de UTF-8
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return new TextDecoder('utf-8').decode(bytes);
  }
}
