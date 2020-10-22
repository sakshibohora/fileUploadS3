import AWS from 'aws-sdk';
import dotenv from 'dotenv';
import express from 'express';
import multer from 'multer';
import path from 'path';
import { successResponse, errorResponse } from './helper';

dotenv.config();

const app = express();
const upload = multer();
const uploads = upload.fields([{ name: 'file', maxCount: 10 }]);

AWS.config.region = 'ap-south-1a';
let accessKeyId;
let secretAccessKey;

const uniqueId = (length = 13) => {
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  for (let i = 0; i < length; i += 1) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
};

const getEC2Rolename = () => {
  const promise = new Promise((resolve, reject) => {
    const metadata = new AWS.MetadataService({
      host: '169.254.169.254',
    });
    metadata.request('/latest/meta-data/iam/security-credentials/', (err, rolename) => {
      if (err) reject(err);
      console.log(rolename);
      resolve(rolename);
    });
  });
  return promise;
};

const getEC2Credentials = (rolename) => {
  const promise = new Promise((resolve, reject) => {
    const metadata = new AWS.MetadataService({
      host: '169.254.169.254',
    });

    metadata.request('/latest/meta-data/iam/security-credentials/' + rolename, (err, data) => {
      console.log("getEC2Credentials -> data", data);
      if (err) reject(err);
      resolve(JSON.parse(data));
    });
  });
  return promise;
};

const getCred = async () => {
  try {
    const getRoleName = await getEC2Rolename();
    console.log("getCred -> getRoleName", getRoleName);
    const credentials = await getEC2Credentials(getRoleName);
    console.log("getCred -> getData", getData);
    return credentials;
  } catch (error) {
    console.log("getCred -> error", error);
  }
};

export default class S3Store {
  constructor(bucket = process.env.AWS_BUCKET_NAME) {
    const credentials = getCred();
    accessKeyId = credentials.AccessKeyId;
    secretAccessKey = credentials.SecretAccessKey;
    if (accessKeyId && secretAccessKey) {
      console.log('Inside if');
      AWS.config.update({
        accessKeyId,
        secretAccessKey,
      });
      this.s3 = new AWS.S3();
      this.bucket = bucket;
    } else {
      console.log('not Found')
    }
  }

  async upload(key, file) {
    const params = {
      Bucket: this.bucket,
      Key: `${key}/${file.uniquename}`,
      Body: file.buffer, // req.file.path
      ContentType: file.mimetype,
      ResponseContentDisposition: `attachment; filename=${file.originalname}`,
      // ContentEncoding: 'base64',
      ACL: 'public-read',
    };
    return new Promise((res, rej) => this.s3.upload(params, (error, data) => {
      if (error) {
        console.log('Error uploading data: ', error);
        rej(error);
      } else {
        res(data.Location);
      }
    }));
  }

  async multiUpload(key, files) {
    try {
      const arr = Array.isArray(files) ? files : [files];
      const uploadedFiles = arr.map(file => this.upload(key, file, true));
      return Promise.all(uploadedFiles);
    } catch (error) {
      throw error;
    }
  }

  async removeFiles(key, files) {
    const arrayOfFiles = Array.isArray(files) ? files : [files];
    const params = {
      Bucket: this.bucket,
      Delete: {
        Objects: arrayOfFiles.map((file) => {
          const arr = file.split('/');
          return ({ Key: `${key}/${decodeURI(arr[arr.length - 1])}` });
        }),
      },
    };

    return new Promise((res, rej) => this.s3.deleteObjects(params, (error, data) => {
      if (error) {
        console.log(error, error.stack);
        rej(error);
      } else {
        console.log('deleted object: ', data);
        res(data);
      }
    }));
  }
}

export const uploadFiles = async (req, res) => {
  try {
    req.setTimeout(900000);
    const { file } = req.files;
    if (!file) {
      throw new Error('file not provided');
    }
    const response = [];
    const s3Store = new S3Store();
    file.map((x) => {
      x.uniquename = `${uniqueId()}${path.extname(x.originalname)}`;
      return x;
    });
    const link = await s3Store.multiUpload('test', file);
    if (!link) {
      throw new Error('link not returned');
    }
    // eslint-disable-next-line array-callback-return
    file.map((x, index) => {
      x.link = link[index];
      response.push({
        assetOrignalName: x.originalname,
        assetName: x.uniquename,
        link: link[index],
      });
    });
    return successResponse(req, res, response);
  } catch (eroor) {
    return errorResponse(req, res, eroor.message);
  }
};

app.post(
  '/uploadImg',
  uploads,
  uploadFiles,
);
app.get("/url", (req, res, next) => {
  res.json(["Tony","Lisa","Michael","Ginger","Food"]);
 });

module.exports = app;
