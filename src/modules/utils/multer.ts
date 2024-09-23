import multer from 'multer';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 1 * 1000 * 1000, // Not more than 10mb
  },
});

export { upload };
