import { Readable } from "stream";

import { cloudinary } from "@/lib/cloudinary";
import { getRequiredEnv } from "@/lib/env";

type UploadResumeFileInput = {
  fileBuffer: Buffer;
  fileName: string;
  userId: string;
};

function ensureCloudinaryConfig() {
  getRequiredEnv("CLOUDINARY_CLOUD_NAME");
  getRequiredEnv("CLOUDINARY_API_KEY");
  getRequiredEnv("CLOUDINARY_API_SECRET");
}

export async function uploadResumeFileToCloudinary({
  fileBuffer,
  fileName,
  userId,
}: UploadResumeFileInput) {
  ensureCloudinaryConfig();

  return new Promise<{ secureUrl: string }>((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `mockai/resumes/${userId}`,
        resource_type: "raw",
        public_id: `${Date.now()}-${fileName.replace(/\s+/g, "-")}`,
        use_filename: true,
      },
      (error, result) => {
        if (error || !result) {
          reject(error ?? new Error("Cloudinary upload failed"));
          return;
        }

        resolve({ secureUrl: result.secure_url });
      },
    );

    Readable.from(fileBuffer).pipe(uploadStream);
  });
}
