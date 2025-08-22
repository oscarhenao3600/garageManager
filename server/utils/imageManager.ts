import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import multer from 'multer';

// Configuración de tipos
interface TallerConfig {
  id: string;
  nombre: string;
  carpeta: string;
  imagenes: {
    logo?: string;
    banner?: string;
    favicon?: string;
    [key: string]: string | undefined;
  };
}

// Configuración de almacenamiento
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOAD_BASE_PATH = path.join(__dirname, '../uploads/talleres');
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// Asegurar que el directorio base existe
if (!fs.existsSync(UPLOAD_BASE_PATH)) {
  fs.mkdirSync(UPLOAD_BASE_PATH, { recursive: true });
}

export class ImageManager {
  private static instance: ImageManager;
  private talleres: Map<string, TallerConfig> = new Map();

  private constructor() {
    this.loadTalleres();
  }

  public static getInstance(): ImageManager {
    if (!ImageManager.instance) {
      ImageManager.instance = new ImageManager();
    }
    return ImageManager.instance;
  }

  /**
   * Crear un nuevo taller con carpeta única
   */
  public async createTaller(nombre: string): Promise<TallerConfig> {
    const id = uuidv4();
    const carpeta = this.generateFolderName(nombre, id);
    const tallerPath = path.join(UPLOAD_BASE_PATH, carpeta);

    // Crear carpeta del taller
    if (!fs.existsSync(tallerPath)) {
      fs.mkdirSync(tallerPath, { recursive: true });
      
      // Crear subcarpetas para diferentes tipos de imágenes
      fs.mkdirSync(path.join(tallerPath, 'logos'), { recursive: true });
      fs.mkdirSync(path.join(tallerPath, 'banners'), { recursive: true });
      fs.mkdirSync(path.join(tallerPath, 'favicons'), { recursive: true });
      fs.mkdirSync(path.join(tallerPath, 'general'), { recursive: true });
    }

    const taller: TallerConfig = {
      id,
      nombre,
      carpeta,
      imagenes: {}
    };

    this.talleres.set(id, taller);
    await this.saveTalleres();
    
    return taller;
  }

  /**
   * Obtener configuración de un taller
   */
  public getTaller(id: string): TallerConfig | undefined {
    return this.talleres.get(id);
  }

  /**
   * Generar nombre de carpeta único
   */
  private generateFolderName(nombre: string, id: string): string {
    const nombreLimpio = nombre
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    
    return `${nombreLimpio}-${id.substring(0, 8)}`;
  }

  /**
   * Subir imagen para un taller específico
   */
  public async uploadImage(
    tallerId: string, 
    tipo: string, 
    file: Express.Multer.File
  ): Promise<string> {
    const taller = this.talleres.get(tallerId);
    if (!taller) {
      throw new Error('Taller no encontrado');
    }

    // Validar tipo de archivo
    if (!ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
      throw new Error('Tipo de archivo no permitido');
    }

    // Validar tamaño
    if (file.size > MAX_FILE_SIZE) {
      throw new Error('Archivo demasiado grande (máximo 5MB)');
    }

    // Generar nombre único para el archivo
    const extension = path.extname(file.originalname);
    const fileName = `${tipo}-${Date.now()}-${uuidv4().substring(0, 8)}${extension}`;
    
    // Determinar subcarpeta según el tipo
    let subcarpeta = 'general';
    if (['logo', 'logos'].includes(tipo)) subcarpeta = 'logos';
    else if (['banner', 'banners'].includes(tipo)) subcarpeta = 'banners';
    else if (['favicon', 'favicons'].includes(tipo)) subcarpeta = 'favicons';

    const filePath = path.join(UPLOAD_BASE_PATH, taller.carpeta, subcarpeta, fileName);
    
    // Crear directorios si no existen
    const dirPath = path.dirname(filePath);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
    
    // Guardar archivo
    fs.writeFileSync(filePath, file.buffer);
    
    // Actualizar configuración del taller
    const relativePath = path.join(taller.carpeta, subcarpeta, fileName).replace(/\\/g, '/');
    taller.imagenes[tipo] = relativePath;
    
    await this.saveTalleres();
    
    return relativePath;
  }

  /**
   * Obtener URL de imagen
   */
  public getImageUrl(tallerId: string, tipo: string): string | null {
    const taller = this.talleres.get(tallerId);
    if (!taller || !taller.imagenes[tipo]) {
      return null;
    }
    
    return `/uploads/talleres/${taller.imagenes[tipo]}`;
  }

  /**
   * Eliminar imagen
   */
  public async deleteImage(tallerId: string, tipo: string): Promise<boolean> {
    const taller = this.talleres.get(tallerId);
    if (!taller || !taller.imagenes[tipo]) {
      return false;
    }

    const imagePath = path.join(UPLOAD_BASE_PATH, taller.imagenes[tipo]);
    
    try {
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
      
      delete taller.imagenes[tipo];
      await this.saveTalleres();
      
      return true;
    } catch (error) {
      console.error('Error eliminando imagen:', error);
      return false;
    }
  }

  /**
   * Obtener lista de imágenes de un taller
   */
  public getTallerImages(tallerId: string): Record<string, string> {
    const taller = this.talleres.get(tallerId);
    return taller ? { ...taller.imagenes } : {};
  }

  /**
   * Cargar configuración de talleres desde archivo
   */
  private async loadTalleres(): Promise<void> {
    const configPath = path.join(UPLOAD_BASE_PATH, 'talleres.json');
    
    try {
      if (fs.existsSync(configPath)) {
        const data = fs.readFileSync(configPath, 'utf8');
        const talleres = JSON.parse(data);
        
        for (const [id, config] of Object.entries(talleres)) {
          this.talleres.set(id, config as TallerConfig);
        }
      }
    } catch (error) {
      console.error('Error cargando configuración de talleres:', error);
    }
  }

  /**
   * Guardar configuración de talleres en archivo
   */
  private async saveTalleres(): Promise<void> {
    const configPath = path.join(UPLOAD_BASE_PATH, 'talleres.json');
    
    try {
      const talleresObj = Object.fromEntries(this.talleres);
      fs.writeFileSync(configPath, JSON.stringify(talleresObj, null, 2));
    } catch (error) {
      console.error('Error guardando configuración de talleres:', error);
    }
  }

  /**
   * Configuración de Multer para subida de archivos
   */
  public getMulterConfig() {
    return multer({
      storage: multer.memoryStorage(),
      limits: {
        fileSize: MAX_FILE_SIZE
      },
      fileFilter: (req, file, cb) => {
        if (ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new Error('Tipo de archivo no permitido'));
        }
      }
    });
  }

  /**
   * Limpiar archivos temporales
   */
  public cleanupTempFiles(): void {
    // Implementar limpieza de archivos temporales si es necesario
  }
}

// Exportar instancia singleton
export const imageManager = ImageManager.getInstance();
