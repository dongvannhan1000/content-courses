import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { getFirebaseStorage } from "@/lib/firebase";
import { randomUUID } from "crypto";

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
 * Generate a unique filename preserving extension
 */
function generateUniqueFilename(originalFilename: string): string {
    const ext = originalFilename.split(".").pop()?.toLowerCase() || "";
    const uuid = crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2);
    const timestamp = Date.now();
    return ext ? `${uuid}-${timestamp}.${ext}` : `${uuid}-${timestamp}`;
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

export const uploadApi = {
    uploadFile,
    validateFile,
    getFolderConfig,
};
