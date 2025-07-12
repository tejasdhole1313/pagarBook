const faceapi = require('face-api.js');
const canvas = require('canvas');
const sharp = require('sharp');
const path = require('path');

// Configure face-api.js to use canvas
const { Canvas, Image, ImageData } = canvas;
faceapi.env.monkeyPatch({ Canvas, Image, ImageData });

// Load face-api models
let modelsLoaded = false;
const loadModels = async () => {
  if (modelsLoaded) return;
  
  try {
    const modelPath = path.join(__dirname, '../faceRecognition/models');
    await faceapi.nets.tinyFaceDetector.loadFromDisk(modelPath);
    await faceapi.nets.faceLandmark68Net.loadFromDisk(modelPath);
    await faceapi.nets.faceRecognitionNet.loadFromDisk(modelPath);
    await faceapi.nets.faceExpressionNet.loadFromDisk(modelPath);
    
    modelsLoaded = true;
    console.log('Face recognition models loaded successfully');
  } catch (error) {
    console.error('Error loading face recognition models:', error);
    throw new Error('Failed to load face recognition models');
  }
};

// Convert base64 image to canvas
const base64ToCanvas = async (base64Data) => {
  try {
    // Remove data URL prefix if present
    const base64 = base64Data.replace(/^data:image\/[a-z]+;base64,/, '');
    const buffer = Buffer.from(base64, 'base64');
    
    // Process image with sharp for better quality
    const processedBuffer = await sharp(buffer)
      .resize(640, 480, { fit: 'inside' })
      .jpeg({ quality: 90 })
      .toBuffer();
    
    const img = new Image();
    img.src = processedBuffer;
    
    const canvas = new Canvas(img.width, img.height);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    
    return canvas;
  } catch (error) {
    console.error('Error converting base64 to canvas:', error);
    throw new Error('Invalid image data');
  }
};

// Detect faces in image
const detectFaces = async (imageCanvas) => {
  try {
    await loadModels();
    
    const detections = await faceapi
      .detectAllFaces(imageCanvas, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceDescriptors();
    
    return detections;
  } catch (error) {
    console.error('Error detecting faces:', error);
    throw new Error('Face detection failed');
  }
};

// Verify face against stored descriptors
const verifyFace = async (faceData, storedDescriptors) => {
  try {
    if (!storedDescriptors || storedDescriptors.length === 0) {
      return {
        verified: false,
        confidence: 0,
        message: 'No stored face descriptors found',
      };
    }

    const imageCanvas = await base64ToCanvas(faceData);
    const detections = await detectFaces(imageCanvas);
    
    if (detections.length === 0) {
      return {
        verified: false,
        confidence: 0,
        message: 'No face detected in image',
      };
    }
    
    if (detections.length > 1) {
      return {
        verified: false,
        confidence: 0,
        message: 'Multiple faces detected. Please ensure only one face is visible',
      };
    }

    const detection = detections[0];
    const descriptor = detection.descriptor;
    
    // Compare with stored descriptors
    let maxDistance = Infinity;
    let bestMatch = null;
    
    for (const storedDescriptor of storedDescriptors) {
      const distance = faceapi.euclideanDistance(descriptor, storedDescriptor);
      if (distance < maxDistance) {
        maxDistance = distance;
        bestMatch = storedDescriptor;
      }
    }
    
    // Convert distance to confidence (0-1 scale)
    // Lower distance = higher confidence
    const confidence = Math.max(0, 1 - maxDistance);
    const threshold = 0.6; // Adjustable threshold
    
    const verified = confidence >= threshold;
    
    return {
      verified,
      confidence,
      distance: maxDistance,
      message: verified 
        ? 'Face verified successfully' 
        : 'Face verification failed - confidence too low',
    };
  } catch (error) {
    console.error('Error verifying face:', error);
    return {
      verified: false,
      confidence: 0,
      message: 'Face verification failed',
    };
  }
};

// Register face and extract descriptors
const registerFace = async (faceData) => {
  try {
    const imageCanvas = await base64ToCanvas(faceData);
    const detections = await detectFaces(imageCanvas);
    
    if (detections.length === 0) {
      throw new Error('No face detected in image');
    }
    
    if (detections.length > 1) {
      throw new Error('Multiple faces detected. Please ensure only one face is visible');
    }
    
    const detection = detections[0];
    const descriptor = detection.descriptor;
    
    // Validate face quality
    const landmarks = detection.landmarks;
    const faceSize = landmarks.getBoundingBox().width * landmarks.getBoundingBox().height;
    
    if (faceSize < 10000) { // Minimum face size threshold
      throw new Error('Face too small or too far from camera');
    }
    
    // Check if face is frontal (basic check)
    const leftEye = landmarks.getLeftEye();
    const rightEye = landmarks.getRightEye();
    const eyeDistance = Math.abs(leftEye[0].x - rightEye[0].x);
    
    if (eyeDistance < 50) { // Minimum eye distance threshold
      throw new Error('Face not clearly visible. Please look directly at the camera');
    }
    
    return {
      success: true,
      descriptor: Array.from(descriptor),
      faceSize,
      eyeDistance,
      message: 'Face registered successfully',
    };
  } catch (error) {
    console.error('Error registering face:', error);
    return {
      success: false,
      message: error.message || 'Face registration failed',
    };
  }
};

// Extract face descriptors from multiple images
const extractFaceDescriptors = async (faceImages) => {
  try {
    const descriptors = [];
    
    for (const imageData of faceImages) {
      const result = await registerFace(imageData);
      if (result.success) {
        descriptors.push(result.descriptor);
      }
    }
    
    if (descriptors.length === 0) {
      throw new Error('No valid faces found in provided images');
    }
    
    return {
      success: true,
      descriptors,
      count: descriptors.length,
      message: `Successfully extracted ${descriptors.length} face descriptors`,
    };
  } catch (error) {
    console.error('Error extracting face descriptors:', error);
    return {
      success: false,
      message: error.message || 'Failed to extract face descriptors',
    };
  }
};

// Liveness detection (basic implementation)
const detectLiveness = async (faceData) => {
  try {
    const imageCanvas = await base64ToCanvas(faceData);
    const detections = await faceapi
      .detectAllFaces(imageCanvas, new faceapi.TinyFaceDetectorOptions())
      .withFaceExpressions();
    
    if (detections.length === 0) {
      return {
        isLive: false,
        confidence: 0,
        message: 'No face detected',
      };
    }
    
    const detection = detections[0];
    const expressions = detection.expressions;
    
    // Basic liveness check based on expression diversity
    const expressionValues = Object.values(expressions);
    const maxExpression = Math.max(...expressionValues);
    const expressionDiversity = expressionValues.filter(val => val > 0.1).length;
    
    // Simple liveness score based on expression characteristics
    const livenessScore = Math.min(1, (maxExpression * 0.5) + (expressionDiversity * 0.1));
    const isLive = livenessScore > 0.3;
    
    return {
      isLive,
      confidence: livenessScore,
      expressions,
      message: isLive ? 'Liveness detected' : 'Liveness check failed',
    };
  } catch (error) {
    console.error('Error detecting liveness:', error);
    return {
      isLive: false,
      confidence: 0,
      message: 'Liveness detection failed',
    };
  }
};

module.exports = {
  verifyFace,
  registerFace,
  extractFaceDescriptors,
  detectLiveness,
  loadModels,
}; 