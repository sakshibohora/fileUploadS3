import path from 'path';
import AWS from 'aws-sdk';
import {
  successResponse, errorResponse, uniqueId,
} from '../../helper';

//AWS.config.region = 'ap-south-1a';

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

export const upload = async (key, file) => {
  const s3 = new AWS.S3();
  const params = {
    Bucket: 'demo-sakshi-ccp',
    Key: `${key}/${file.uniquename}`,
    Body: file.buffer, // req.file.path
    ContentType: file.mimetype,
    ResponseContentDisposition: `attachment; filename=${file.originalname}`,
    // ContentEncoding: 'base64',
    ACL: 'public-read',
  };
  return new Promise((res, rej) => s3.upload(params, (error, data) => {
    if (error) {
      console.log('Error uploading data: ', error);
      rej(error);
    } else {
      res(data.Location);
    }
  }));
};

export const multiUpload = async (key, files) => {
  try {
    const arr = Array.isArray(files) ? files : [files];
    const uploadedFiles = arr.map(file => upload(key, file, true));
    return Promise.all(uploadedFiles);
  } catch (error) {
    throw error;
  }
};

export const uploadFiles = async (req, res) => {
  try {
    const getRoleName = await getEC2Rolename();
    console.log("getCred -> getRoleName", getRoleName);
    const credentials = await getEC2Credentials(getRoleName);
    console.log("uploadFiles -> credentials", credentials);

    req.setTimeout(900000);
    const { file } = req.files;
    if (!file) {
      throw new Error('file not provided');
    }
    const response = [];
    AWS.config.update({
      accessKeyId: credentials.accessKeyId,
      secretAccessKey: credentials.secretAccessKey,
    });
    file.map((x) => {
      x.uniquename = `${uniqueId()}${path.extname(x.originalname)}`;
      return x;
    });
    const link = await multiUpload('test', file);
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
