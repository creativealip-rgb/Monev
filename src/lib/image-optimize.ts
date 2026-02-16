import sharp from "sharp";

export interface OptimizeImageOptions {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
    format?: "jpeg" | "png" | "webp";
}

const DEFAULT_OPTIONS: OptimizeImageOptions = {
    maxWidth: 1024,
    maxHeight: 1024,
    quality: 80,
    format: "jpeg",
};

/**
 * Optimize an image for OCR processing
 * Resizes large images and compresses them to reduce processing time
 * @param inputBuffer - Raw image buffer
 * @param options - Optimization options
 * @returns Optimized image buffer
 */
export async function optimizeImage(
    inputBuffer: Buffer,
    options: OptimizeImageOptions = {}
): Promise<Buffer> {
    const { maxWidth, maxHeight, quality, format } = { ...DEFAULT_OPTIONS, ...options };

    const pipeline = sharp(inputBuffer)
        .resize(maxWidth, maxHeight, {
            fit: "inside",
            withoutEnlargement: true,
        })
        .grayscale(false); // Keep colors for receipt images

    switch (format) {
        case "png":
            return pipeline.png({ quality, compressionLevel: 9 }).toBuffer();
        case "webp":
            return pipeline.webp({ quality }).toBuffer();
        case "jpeg":
        default:
            return pipeline.jpeg({ quality }).toBuffer();
    }
}

/**
 * Get image metadata without full processing
 * @param inputBuffer - Raw image buffer
 * @returns Image metadata
 */
export async function getImageMetadata(inputBuffer: Buffer): Promise<sharp.Metadata> {
    return sharp(inputBuffer).metadata();
}

/**
 * Check if image needs optimization (is large)
 * @param inputBuffer - Raw image buffer
 * @param thresholdBytes - Size threshold in bytes (default 500KB)
 * @returns Boolean indicating if optimization is needed
 */
export async function needsOptimization(
    inputBuffer: Buffer,
    thresholdBytes: number = 500 * 1024
): Promise<boolean> {
    return inputBuffer.length > thresholdBytes;
}

/**
 * Convert base64 image to optimized buffer
 * @param base64String - Base64 encoded image (with or without data URL prefix)
 * @param options - Optimization options
 * @returns Optimized image buffer
 */
export async function optimizeBase64Image(
    base64String: string,
    options: OptimizeImageOptions = {}
): Promise<{ buffer: Buffer; metadata: sharp.Metadata }> {
    // Remove data URL prefix if present
    const base64Data = base64String.replace(/^data:image\/\w+;base64,/, "");
    const inputBuffer = Buffer.from(base64Data, "base64");

    // Check if optimization is needed
    const shouldOptimize = await needsOptimization(inputBuffer);
    
    if (!shouldOptimize) {
        const metadata = await getImageMetadata(inputBuffer);
        return { buffer: inputBuffer, metadata };
    }

    const optimizedBuffer = await optimizeImage(inputBuffer, options);
    const metadata = await getImageMetadata(optimizedBuffer);

    return { buffer: optimizedBuffer, metadata };
}

/**
 * Create a thumbnail for preview purposes
 * @param inputBuffer - Raw image buffer
 * @param size - Thumbnail size (default 200px)
 * @returns Thumbnail buffer
 */
export async function createThumbnail(
    inputBuffer: Buffer,
    size: number = 200
): Promise<Buffer> {
    return sharp(inputBuffer)
        .resize(size, size, {
            fit: "cover",
            position: "center",
        })
        .jpeg({ quality: 70 })
        .toBuffer();
}
