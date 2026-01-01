import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage";
import { getFirebaseStorage } from "@/lib/firebase";

export type UploadFolder = "thumbnails" | "videos" | "documents" | "avatars";

// Folder configuration
const FOLDER_CONFIG: Record<UploadFolder, { allowedTypes: string[]; maxSize: number }> = {
    thumbnails: {
        allowedTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
        maxSize: 5 * 1024 * 1024, // 5MB
    },
    videos: {
        allowedTypes: ["video/mp4", "video/webm", "video/quicktime"],
        maxSize: 2 * 1024 * 1024 * 1024, // 2GB
    },
    documents: {
        allowedTypes: ["application/pdf", "application/msword"],
        maxSize: 50 * 1024 * 1024, // 50MB
    },
    avatars: {
        allowedTypes: ["image/jpeg", "image/png", "image/webp"],
        maxSize: 2 * 1024 * 1024, // 2MB
    },
};

/**
 * Sanitize filename for storage (remove special chars, Vietnamese diacritics)
 */
function sanitizeFilename(filename: string): string {
    // Remove extension
    const namePart = filename.replace(/\.[^/.]+$/, "");

    return namePart
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // Remove diacritics
        .replace(/đ/g, "d")
        .replace(/[^a-z0-9]/g, "-") // Replace special chars with -
        .replace(/-+/g, "-") // Multiple - to single -
        .replace(/^-|-$/g, "") // Trim - from ends
        .slice(0, 50); // Max 50 chars
}

/**
 * Generate a readable unique filename
 * Format: {timestamp}-{sanitized-original-name}.{ext}
 * Example: 1767265225-my-course-thumbnail.png
 */
function generateUniqueFilename(originalFilename: string): string {
    const ext = originalFilename.split(".").pop()?.toLowerCase() || "";
    const sanitizedName = sanitizeFilename(originalFilename);
    const timestamp = Math.floor(Date.now() / 1000); // Unix seconds

    return ext
        ? `${timestamp}-${sanitizedName || "file"}.${ext}`
        : `${timestamp}-${sanitizedName || "file"}`;
}

/**
 * Validate file before upload
 */
export function validateFile(
    file: File,
    folder: UploadFolder
): { valid: boolean; error?: string } {
    const config = FOLDER_CONFIG[folder];

    if (!config.allowedTypes.includes(file.type)) {
        return {
            valid: false,
            error: `Định dạng không hỗ trợ. Chấp nhận: ${config.allowedTypes.join(", ")}`,
        };
    }

    if (file.size > config.maxSize) {
        const maxSizeMB = Math.round(config.maxSize / (1024 * 1024));
        return {
            valid: false,
            error: `File quá lớn. Tối đa ${maxSizeMB}MB`,
        };
    }

    return { valid: true };
}

/**
 * Upload file to Firebase Storage
 * Returns the download URL
 */
export async function uploadFile(
    file: File,
    folder: UploadFolder = "thumbnails",
    onProgress?: (progress: number) => void
): Promise<string> {
    // Validate
    const validation = validateFile(file, folder);
    if (!validation.valid) {
        throw new Error(validation.error);
    }

    const storage = getFirebaseStorage();
    const uniqueFilename = generateUniqueFilename(file.name);
    const filePath = `${folder}/${uniqueFilename}`;
    const storageRef = ref(storage, filePath);

    // Upload with progress tracking
    return new Promise((resolve, reject) => {
        const uploadTask = uploadBytesResumable(storageRef, file, {
            contentType: file.type,
        });

        uploadTask.on(
            "state_changed",
            (snapshot) => {
                const progress = Math.round(
                    (snapshot.bytesTransferred / snapshot.totalBytes) * 100
                );
                onProgress?.(progress);
            },
            (error) => {
                console.error("Upload error:", error);
                reject(new Error("Không thể tải lên. Vui lòng thử lại."));
            },
            async () => {
                try {
                    const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                    resolve(downloadURL);
                } catch (error) {
                    reject(new Error("Không thể lấy URL. Vui lòng thử lại."));
                }
            }
        );
    });
}

/**
 * Get folder configuration
 */
export function getFolderConfig(folder: UploadFolder) {
    return FOLDER_CONFIG[folder];
}

/**
 * Delete a file from Firebase Storage
 * Used to cleanup orphaned files when user changes/removes upload
 */
export async function deleteFile(fileUrl: string): Promise<void> {
    if (!fileUrl) return;

    // Only delete Firebase Storage URLs
    if (!fileUrl.includes("firebasestorage.googleapis.com")) {
        console.log("Skipping delete - not a Firebase Storage URL");
        return;
    }

    try {
        const storage = getFirebaseStorage();
        // Extract path from URL
        // URL format: https://firebasestorage.googleapis.com/v0/b/{bucket}/o/{path}?...
        const urlObj = new URL(fileUrl);
        const pathMatch = urlObj.pathname.match(/\/o\/(.+)$/);
        if (!pathMatch) {
            console.warn("Could not extract path from URL:", fileUrl);
            return;
        }

        const filePath = decodeURIComponent(pathMatch[1]);
        const fileRef = ref(storage, filePath);
        await deleteObject(fileRef);
        console.log("Deleted file:", filePath);
    } catch (error) {
        // Don't throw - deletion failure shouldn't break the flow
        console.warn("Failed to delete file:", error);
    }
}

export const uploadApi = {
    uploadFile,
    deleteFile,
    validateFile,
    getFolderConfig,
};
