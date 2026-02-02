package cloudinary

import (
	"context"
	"fmt"
	"mime/multipart"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/cloudinary/cloudinary-go/v2"
	"github.com/cloudinary/cloudinary-go/v2/api/uploader"
)

var cld *cloudinary.Cloudinary

// InitCloudinary inicializa la conexión con Cloudinary
func InitCloudinary() error {
	cloudName := os.Getenv("CLOUDINARY_CLOUD_NAME")
	apiKey := os.Getenv("CLOUDINARY_API_KEY")
	apiSecret := os.Getenv("CLOUDINARY_API_SECRET")

	if cloudName == "" || apiKey == "" || apiSecret == "" {
		return fmt.Errorf("faltan credenciales de Cloudinary en las variables de entorno")
	}

	var err error
	cld, err = cloudinary.NewFromParams(cloudName, apiKey, apiSecret)
	if err != nil {
		return fmt.Errorf("error inicializando Cloudinary: %w", err)
	}

	return nil
}

// UploadImage sube una imagen a Cloudinary y retorna la URL
func UploadImage(file multipart.File, filename string, folder string) (string, error) {
	if cld == nil {
		if err := InitCloudinary(); err != nil {
			return "", err
		}
	}

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	// Limpiar el nombre del archivo
	cleanFilename := strings.ReplaceAll(filename, " ", "_")
	ext := filepath.Ext(cleanFilename)
	nameWithoutExt := strings.TrimSuffix(cleanFilename, ext)
	
	// Public ID en Cloudinary (sin extensión)
	publicID := fmt.Sprintf("%s/%s", folder, nameWithoutExt)

	// Subir a Cloudinary
	overwriteVal := true
	uploadResult, err := cld.Upload.Upload(ctx, file, uploader.UploadParams{
		PublicID:     publicID,
		Folder:       folder,
		ResourceType: "image",
		Overwrite:    &overwriteVal,
	})

	if err != nil {
		return "", fmt.Errorf("error subiendo imagen a Cloudinary: %w", err)
	}

	return uploadResult.SecureURL, nil
}

// DeleteImage elimina una imagen de Cloudinary usando su URL
func DeleteImage(imageURL string) error {
	if cld == nil {
		if err := InitCloudinary(); err != nil {
			return err
		}
	}

	// Extraer el public_id de la URL de Cloudinary
	// Ejemplo: https://res.cloudinary.com/xxx/image/upload/v123456/folder/image.jpg
	// Public ID sería: folder/image
	parts := strings.Split(imageURL, "/upload/")
	if len(parts) < 2 {
		return fmt.Errorf("URL de Cloudinary inválida")
	}

	pathParts := strings.Split(parts[1], "/")
	if len(pathParts) < 2 {
		return fmt.Errorf("no se pudo extraer el public_id de la URL")
	}

	// Reconstruir el public_id (sin versión ni extensión)
	publicIDParts := pathParts[1:] // Saltar la versión (v123456)
	publicID := strings.Join(publicIDParts, "/")
	publicID = strings.TrimSuffix(publicID, filepath.Ext(publicID))

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	_, err := cld.Upload.Destroy(ctx, uploader.DestroyParams{
		PublicID:     publicID,
		ResourceType: "image",
	})

	return err
}
