import * as faceapi from 'face-api.js';

const MODEL_URL = 'https://justadudewhohacks.github.io/face-api.js/models';

class FaceVerificationService {
  private modelsLoaded = false;

  async loadModels() {
    if (this.modelsLoaded) return;
    
    try {
      await Promise.all([
        faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
      ]);
      this.modelsLoaded = true;
    } catch (error) {
      console.error('Error loading face-api models:', error);
      throw new Error('Face recognition models failed to load. Please check your internet connection.');
    }
  }

  async getDescriptor(imageSrc: string): Promise<Float32Array | null> {
    await this.loadModels();
    
    const img = await faceapi.fetchImage(imageSrc);
    const detection = await faceapi.detectSingleFace(img)
      .withFaceLandmarks()
      .withFaceDescriptor();
    
    return detection ? detection.descriptor : null;
  }

  async verifyMatch(profilePhoto: string, capturePhoto: string): Promise<{ match: boolean; confidence: number }> {
    try {
      const descriptor1 = await this.getDescriptor(profilePhoto);
      const descriptor2 = await this.getDescriptor(capturePhoto);

      if (!descriptor1 || !descriptor2) {
        throw new Error(!descriptor1 ? 'No face detected in profile photo.' : 'No face detected in capture.');
      }

      const distance = faceapi.euclideanDistance(descriptor1, descriptor2);
      // Distance < 0.6 is typically considered a match with SSD MobileNet V1
      const threshold = 0.6;
      const match = distance < threshold;
      const confidence = Math.max(0, (1 - distance) * 100);

      return { match, confidence };
    } catch (e: any) {
      console.error('Face verification failed:', e);
      throw e;
    }
  }
}

export const faceService = new FaceVerificationService();
