'use strict';

module.exports = ({ env }) => ({
  upload: {
    config: {
      provider: 'aws-s3',
      providerOptions: {
        s3Options: {
          credentials: {
            accessKeyId: env('AWS_ACCESS_KEY_ID'),
            secretAccessKey: env('AWS_SECRET_ACCESS_KEY'),
          },
          endpoint: 'https://fly.storage.tigris.dev',
          region: 'auto',
        },
        params: { Bucket: env('BUCKET_NAME') },
        baseUrl: `https://${env('BUCKET_NAME')}.fly.storage.tigris.dev`,
      },
      actionOptions: {
        upload: {},
        uploadStream: {},
        delete: {},
      },
    },
  },
  ckeditor: { enabled: true },
  'strapi-content-mcp': {
    enabled: true,
    config: { logLevel: 'info' },
  },
});
