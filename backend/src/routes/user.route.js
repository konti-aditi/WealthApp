const { Router } = require("express");
const multer = require("multer");
const ffmpeg = require("ffmpeg");
const fs = require("fs");
const path = require("path");
const { promisify } = require("util");
const unlinkAsync = promisify(fs.unlink);

var multerGoogleStorage = require("multer-google-storage");
var uploadHandler = multer({
  storage: multerGoogleStorage.storageEngine({
    autoRetry: true,
    bucket: "calcium-backup-481015-r3.appspot.com",
    projectId: "calcium-backup-481015-r3",
    keyFilename: "./key.json",
    filename: (req, file, cb) => {
      try {
        cb(null, `projectimages/${Date.now()}_${file.originalname}`);
      } catch (error) {
        console.error("Error in filename callback:", error);
        cb(error);
      }
    },
  }),
});

// Multer storage for temporary video uploads (local processing)
const videoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const tempDir = path.join(__dirname, "../temp");
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    cb(null, tempDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}_${file.originalname}`);
  },
});

const videoUpload = multer({
  storage: videoStorage,
  limits: {
    fileSize: 1024 * 1024 * 100, // 100MB limit for videos
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("video/")) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only video files are allowed."));
    }
  },
});

const fileFilter = (_, file, cb) => {
  if (
    file.mimetype === "image/jpeg" ||
    file.mimetype === "image/png" ||
    file.mimetype === "image/heic" ||
    file.mimetype === "application/pdf"
  ) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type"));
  }
};

const {
  loginUser,
  getUserProfile,
  uploadImages,
  verifyLoginOTP,
  resendOTP,
  changePassword,
  getRandomWealth,
} = require("../controller");
const { checkRole, log } = require("../middlewares");

const router = Router();

router.post("/upload", uploadHandler.any(), function (req, res) {
  try {
    console.log(req.files);
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        message: "No files uploaded",
        status: false,
      });
    }
    const fileLinks = req.files.map((file) => `${file.path}`);
    res.status(200).json({
      message: "Files uploaded successfully",
      status: true,
      link: fileLinks[0],
    });
  } catch (err) {
    console.error("Error in upload route:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Helper function to clean up temp files
async function cleanupTempFiles(dirPath, olderThanMinutes = 60) {
  try {
    const now = Date.now();
    const files = fs.readdirSync(dirPath);
    let cleanedCount = 0;

    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const stats = fs.statSync(filePath);
      const fileAgeMinutes = (now - stats.mtimeMs) / 1000 / 60;

      if (fileAgeMinutes > olderThanMinutes) {
        await unlinkAsync(filePath);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      console.log(`Cleaned up ${cleanedCount} old temp files`);
    }
  } catch (error) {
    console.error("Error cleaning temp files:", error.message);
  }
}

// NEW ENDPOINT: Rotate video
router.post("/rotate-video", videoUpload.single("video"), async (req, res) => {
  // Extend timeout for this specific request (10 minutes)
  req.setTimeout(600000);
  res.setTimeout(600000);

  // Prevent socket from being destroyed
  if (req.socket) {
    req.socket.setTimeout(600000);
  }

  // Set keep-alive headers
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Keep-Alive', 'timeout=600');

  let inputPath = null;
  let outputPath = null;
  let filesToCleanup = []; // Track all files to cleanup

  try {
    if (!req.file) {
      return res.status(400).json({
        message: "No video file uploaded",
        status: false,
      });
    }

    inputPath = req.file.path;
    filesToCleanup.push(inputPath);

    const outputFilename = `rotated_${Date.now()}_${path.parse(req.file.originalname).name}.mp4`;
    outputPath = path.join(path.dirname(inputPath), outputFilename);
    filesToCleanup.push(outputPath);

    console.log(`Rotating video: ${inputPath}`);

    // Clean up old temp files (older than 1 hour) to prevent disk buildup
    cleanupTempFiles(path.dirname(inputPath), 60).catch((err) =>
      console.error("Background cleanup failed:", err)
    );

    // Process video with ffmpeg package
    const video = await new ffmpeg(inputPath);

    // Get video metadata to understand current rotation and dimensions
    const metadata = video.metadata;
    console.log('Video metadata:', JSON.stringify({
      width: metadata.video.resolution.w,
      height: metadata.video.resolution.h,
      rotation: metadata.video.rotate
    }));

    // Detect rotation from metadata
    const currentRotation = metadata.video.rotate || 0;

    // If video already has rotation metadata (90, 180, 270), we need to:
    // 1. Remove the rotation metadata
    // 2. Actually rotate the pixels to correct orientation
    // 3. Update dimensions accordingly

    let filterComplex = '';

    if (currentRotation === 90 || currentRotation === 270) {
      // 90° or 270° rotations swap width and height
      // transpose=2 corrects 90° CW rotation (rotates 90° CCW)
      // transpose=1 corrects 270° CW rotation (rotates 90° CW)
      if (currentRotation === 90) {
        filterComplex = 'transpose=2'; // Rotate 90° CCW to correct
      } else {
        filterComplex = 'transpose=1'; // Rotate 90° CW to correct
      }
    } else if (currentRotation === 180) {
      // 180° rotation - flip both horizontally and vertically
      filterComplex = 'hflip,vflip';
    }

    video.setVideoFormat('mp4');

    if (filterComplex) {
      console.log(`Applying filter to correct rotation: ${filterComplex}`);
      video.addFilterComplex(filterComplex);
    }

    // Remove rotation metadata from output
    video.addCommand('-metadata:s:v:0', 'rotate=0');

    await video.save(outputPath);

    console.log("Video rotation completed");

    // Verify output video dimensions
    try {
      const outputVideo = await new ffmpeg(outputPath);
      const outputMetadata = outputVideo.metadata;
      console.log('Output video dimensions:', JSON.stringify({
        width: outputMetadata.video.resolution.w,
        height: outputMetadata.video.resolution.h,
        rotation: outputMetadata.video.rotate || 0
      }));
    } catch (verifyErr) {
      console.log('Could not verify output dimensions:', verifyErr.message);
    }

    // Upload processed video to Google Cloud Storage
    const { Storage } = require("@google-cloud/storage");
    const storage = new Storage({
      projectId: "calcium-backup-481015-r3",
      keyFilename: "./key.json",
    });

    const bucket = storage.bucket("calcium-backup-481015-r3.appspot.com");
    const gcsFilename = `rotated-videos/${Date.now()}_${outputFilename}`;
    const blob = bucket.file(gcsFilename);

    await new Promise((resolve, reject) => {
      fs.createReadStream(outputPath)
        .pipe(
          blob.createWriteStream({
            resumable: false,
            metadata: {
              contentType: "video/mp4",
            },
          })
        )
        .on("error", reject)
        .on("finish", resolve);
    });

    console.log("Video uploaded to GCS:", gcsFilename);

    // Return success response immediately
    const responseData = {
      message: "Video rotated successfully",
      status: true,
      link: gcsFilename,
      publicUrl: `https://storage.googleapis.com/calcium-backup-481015-r3.appspot.com/${gcsFilename}`,
    };

    res.status(200);
    res.setHeader('Content-Type', 'application/json');
    res.write(JSON.stringify(responseData));
    res.end();

    // Clean up temporary files in background (after response is sent)
    setImmediate(async () => {
      for (const file of filesToCleanup) {
        if (fs.existsSync(file)) {
          try {
            await unlinkAsync(file);
            console.log(`Cleaned up: ${path.basename(file)}`);
          } catch (cleanupErr) {
            console.error(`Error cleaning up ${file}:`, cleanupErr.message);
          }
        }
      }
    });
  } catch (err) {
    console.error("Error in rotate-video route:", err);

    // Clean up files on error
    for (const file of filesToCleanup) {
      if (file && fs.existsSync(file)) {
        try {
          await unlinkAsync(file);
          console.log(`Cleaned up on error: ${path.basename(file)}`);
        } catch (cleanupErr) {
          console.error(`Error cleaning up ${file}:`, cleanupErr.message);
        }
      }
    }

    // Only send error response if headers haven't been sent
    if (!res.headersSent) {
      res.status(500).json({
        message: "Error rotating video",
        status: false,
        error: err.message,
      });
    }
  }
});

router.post("/login", log, loginUser);
router.post("/verify-otp", log, verifyLoginOTP);
router.post("/resend-otp", log, resendOTP);

router.get(
  "/random-wealth",
  checkRole(["ADMIN", "COMPANY_ADMIN", "EMPLOYEE"]),
  log,
  getRandomWealth
);

router.post(
  "/change-password",
  checkRole(["ADMIN", "COMPANY_ADMIN", "EMPLOYEE"]),
  log,
  changePassword
);

module.exports = router;