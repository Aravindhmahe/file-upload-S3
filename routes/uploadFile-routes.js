const express = require(`express`);
const multer = require(`multer`);
const router = express.Router();

const {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
} = require(`@aws-sdk/client-s3`);

const presigner = require("@aws-sdk/s3-request-presigner");

const dotenv = require(`dotenv`);
dotenv.config();

const s3 = new S3Client({
  credentials: {
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
    accessKeyId: process.env.ACCESS_KEY,
  },
  region: process.env.BUCKET_REGION,
});
const bucketName = process.env.BUCKET_NAME;

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

/**
 * Test API to check status of service
 */
router.get(`/test`, (req, res) => {
  res.status(200).json({ message: `service is up` });
});

/**
 * API to upload file to S3 from multer
 */
router.post(`/uploadFile`, upload.single(`file`), (req, res) => {
  const objectParams = new PutObjectCommand({
    Bucket: bucketName,
    Key: req.file.originalname,
    Body: req.file.buffer,
    ContentType: req.file.mimetype,
  });

  s3.send(objectParams)
    .then(() => {
      res.status(200).json({
        statusCode: `OK`,
        status: `SUCCESS`,
        message: `File uploaded !!`,
      });
    })
    .catch((error) => {
      res.status(200).json({
        statusCode: `OK`,
        status: `FAILURE`,
        message: `Unexpected Error !!`,
      });
    });
});

/**
 * API to list objects in the bucket
 */
router.get("/listObjects", (req, res) => {
  const command = new ListObjectsV2Command({ Bucket: bucketName });
  s3.send(command)
    .then((result) => {
      res
        .status(200)
        .json({ statusCode: `OK`, status: `SUCCESS`, data: result.Contents });
    })
    .catch((error) => {
      console.log("Result", error);

      res.status(200).json({
        statusCode: `OK`,
        status: `FAILURE`,
        message: error,
      });
    });
});

/**
 * API to fetch presigned URL from the required file
 */
router.get("/getFile/:name", async (req, res) => {
  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: req.params.name,
  });
  const result = await presigner.getSignedUrl(s3, command, { expiresIn: 3000 });

  res.status(200).json({ statusCode: `OK`, status: `SUCCESS`, data: result });
});

module.exports = router;
