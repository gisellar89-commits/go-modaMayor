package main

import (
	"fmt"
	"os"
)

func main() {
	fmt.Println("🔍 Verificando variables de Cloudinary:")
	fmt.Println("=========================================")
	
	cloudName := os.Getenv("CLOUDINARY_CLOUD_NAME")
	apiKey := os.Getenv("CLOUDINARY_API_KEY")
	apiSecret := os.Getenv("CLOUDINARY_API_SECRET")
	
	if cloudName == "" {
		fmt.Println("❌ CLOUDINARY_CLOUD_NAME: NO configurada")
	} else {
		fmt.Printf("✅ CLOUDINARY_CLOUD_NAME: %s\n", cloudName)
	}
	
	if apiKey == "" {
		fmt.Println("❌ CLOUDINARY_API_KEY: NO configurada")
	} else {
		fmt.Printf("✅ CLOUDINARY_API_KEY: %s... (primeros 10 chars)\n", apiKey[:10])
	}
	
	if apiSecret == "" {
		fmt.Println("❌ CLOUDINARY_API_SECRET: NO configurada")
	} else {
		fmt.Println("✅ CLOUDINARY_API_SECRET: Configurada (oculta por seguridad)")
	}
	
	fmt.Println("\n📝 Instrucciones:")
	if cloudName == "" || apiKey == "" || apiSecret == "" {
		fmt.Println("⚠️  Faltan variables de entorno de Cloudinary")
		fmt.Println("👉 Ve a Render Dashboard → Tu servicio de backend → Environment")
		fmt.Println("👉 Agrega estas 3 variables:")
		fmt.Println("   CLOUDINARY_CLOUD_NAME=de3do7vsj")
		fmt.Println("   CLOUDINARY_API_KEY=976863789327936")
		fmt.Println("   CLOUDINARY_API_SECRET=5f5IQjH5ZLn0Yk_IHcs-1hTwy14")
	} else {
		fmt.Println("✅ Todas las variables están configuradas correctamente")
	}
}
