import { Router, Request, Response } from 'express';
import { authenticateToken, isAdmin, type AuthenticatedRequest } from '../middleware/authMiddleware';
import { imageManager } from '../utils/imageManager';

const router = Router();

// Middleware para manejo de errores
const handleError = (res: Response, error: any) => {
  console.error('Error en gestión de imágenes:', error);
  res.status(500).json({ 
    message: 'Error interno del servidor',
    error: error.message 
  });
};

/**
 * POST /api/images/taller
 * Crear un nuevo taller con carpeta única
 */
router.post('/taller', authenticateToken, isAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { nombre } = req.body;
    
    if (!nombre || typeof nombre !== 'string') {
      return res.status(400).json({ message: 'Nombre del taller es requerido' });
    }

    const taller = await imageManager.createTaller(nombre);
    
    res.status(201).json({
      message: 'Taller creado exitosamente',
      taller
    });
  } catch (error) {
    handleError(res, error);
  }
});

/**
 * GET /api/images/taller/:id
 * Obtener configuración de un taller
 */
router.get('/taller/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const taller = imageManager.getTaller(id);
    
    if (!taller) {
      return res.status(404).json({ message: 'Taller no encontrado' });
    }

    res.json({
      taller,
      imagenes: imageManager.getTallerImages(id)
    });
  } catch (error) {
    handleError(res, error);
  }
});

/**
 * POST /api/images/upload/:tallerId/:tipo
 * Subir imagen para un taller específico
 */
router.post('/upload/:tallerId/:tipo', 
  authenticateToken, 
  isAdmin, 
  imageManager.getMulterConfig().single('image'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { tallerId, tipo } = req.params;
      const file = req.file;

      if (!file) {
        return res.status(400).json({ message: 'No se proporcionó archivo' });
      }

      // Validar tipo de imagen
      const tiposValidos = ['logo', 'banner', 'favicon', 'general'];
      if (!tiposValidos.includes(tipo)) {
        return res.status(400).json({ 
          message: 'Tipo de imagen no válido. Tipos permitidos: logo, banner, favicon, general' 
        });
      }

      const imagePath = await imageManager.uploadImage(tallerId, tipo, file);
      
      res.json({
        message: 'Imagen subida exitosamente',
        imagePath,
        imageUrl: imageManager.getImageUrl(tallerId, tipo)
      });
    } catch (error) {
      handleError(res, error);
    }
  }
);

/**
 * GET /api/images/:tallerId/:tipo
 * Obtener URL de una imagen específica
 */
router.get('/:tallerId/:tipo', async (req: Request, res: Response) => {
  try {
    const { tallerId, tipo } = req.params;
    const imageUrl = imageManager.getImageUrl(tallerId, tipo);
    
    if (!imageUrl) {
      return res.status(404).json({ message: 'Imagen no encontrada' });
    }

    res.json({ imageUrl });
  } catch (error) {
    handleError(res, error);
  }
});

/**
 * DELETE /api/images/:tallerId/:tipo
 * Eliminar una imagen específica
 */
router.delete('/:tallerId/:tipo', authenticateToken, isAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { tallerId, tipo } = req.params;
    const success = await imageManager.deleteImage(tallerId, tipo);
    
    if (!success) {
      return res.status(404).json({ message: 'Imagen no encontrada' });
    }

    res.json({ message: 'Imagen eliminada exitosamente' });
  } catch (error) {
    handleError(res, error);
  }
});

/**
 * GET /api/images/:tallerId
 * Obtener todas las imágenes de un taller
 */
router.get('/:tallerId', async (req: Request, res: Response) => {
  try {
    const { tallerId } = req.params;
    const imagenes = imageManager.getTallerImages(tallerId);
    
    res.json({
      tallerId,
      imagenes,
      total: Object.keys(imagenes).length
    });
  } catch (error) {
    handleError(res, error);
  }
});

/**
 * GET /api/images
 * Obtener lista de todos los talleres (solo admin)
 */
router.get('/', authenticateToken, isAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Esta funcionalidad se puede implementar si es necesario
    res.json({
      message: 'Endpoint para listar talleres - implementar según necesidad'
    });
  } catch (error) {
    handleError(res, error);
  }
});

export default router;
