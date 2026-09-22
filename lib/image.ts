// Compresse une photo prise au téléphone AVANT de l'envoyer.
// Les photos de smartphone font souvent 3-8 Mo : sur le wifi d'un château ça
// serait très lent. On vise ~0.8 Mo / 1600px max, largement suffisant.
import imageCompression from "browser-image-compression";

export async function compressImage(file: File): Promise<File> {
  try {
    return await imageCompression(file, {
      maxSizeMB: 0.8,
      maxWidthOrHeight: 1600,
      useWebWorker: true,
    });
  } catch {
    // Si la compression échoue pour une raison quelconque, on envoie l'original
    // plutôt que de bloquer l'invité.
    return file;
  }
}
