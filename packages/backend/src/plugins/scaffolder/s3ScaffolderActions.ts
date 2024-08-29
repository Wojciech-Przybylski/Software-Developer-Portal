import { createTemplateAction } from "@backstage/plugin-scaffolder-node";
import { s3Manager } from "../catalog";

const fs = require('fs');
// import backendCommon from '@backstage/backend-common';
var backendCommon = require('@backstage/backend-common');
const glob = require('glob');

import { 
    S3Client, 
    CreateBucketCommand, 
    PutBucketWebsiteCommand, 
    PutPublicAccessBlockCommand,
    PutBucketPolicyCommand,
    PutObjectCommand,
} from '@aws-sdk/client-s3';

function _interopDefaultLegacy (e: typeof fs) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }
var fs__default = /*#__PURE__*/_interopDefaultLegacy(fs);
var glob__default = /*#__PURE__*/_interopDefaultLegacy(glob);

export const createS3BucketCreateAction = (options: { credentials: () => any; } | null) => {
    return createTemplateAction({
        id: 'ons:aws:s3:create',
        description: 'Creates a new S3 bucket',
        schema: {
            input: {
                required: ["bucket"],
                type: "object",
                properties: {
                    bucket: {
                        title: "Bucket",
                        description: "The name of the bucket to create.",
                        type: "string",
                    }
                }
            }
        },
        async handler(ctx) {
            if (options == null) { 
                ctx.logger.error("Did you forget to supply credentials?")
                throw new Error("handler options object is null"); 
            }
            const config = {
                ...(options == null ? void 0 : options.credentials) && {
                credentials: await options.credentials()
                },
            };

            const s3Client = new S3Client(config);
            await s3Client.send(new CreateBucketCommand({
                Bucket: ctx.input.bucket?.toString(),    
            }));
        },
    })
}

export const createS3BucketEnableWebsiteAction = (options: { credentials: () => any } | null) => {
    return createTemplateAction({
        id: "ons:aws:s3:enableWebsite",
        description: "Configures web hosting for the given bucket.",
        schema: {
            input: {
                required: ["bucket"],
                type: "object",
                properties: {
                    bucket: {
                        title: "Bucket",
                        description: "The name of the bucket to enable website hosting for.",
                        type: "string",
                    },
                }
            }
        },
        async handler(ctx) {
            if (options == null) { 
                ctx.logger.error("Did you forget to supply credentials?")
                throw new Error("handler options object is null"); 
            }
            const config = {
                ...(options == null ? void 0 : options.credentials) && {
                credentials: await options.credentials()
                },
            };

            const bucket = ctx.input.bucket?.toString();
            const s3Client = new S3Client(config);
            
            ctx.logger.info(`Enabling web hosting on bucket ${ bucket }`)
            await s3Client.send(new PutBucketWebsiteCommand({
                Bucket: bucket,
                WebsiteConfiguration: {
                    IndexDocument: { Suffix: "index.html" }
                }
            }));
            ctx.logger.info(`Disabling BlockPublicAcls`)
            await s3Client.send(new PutPublicAccessBlockCommand({
                Bucket: bucket,
                PublicAccessBlockConfiguration: {
                    BlockPublicAcls: false,
                }
            }))
            ctx.logger.info(`Amending bucket policy to allow public read`)
            await s3Client.send(new PutBucketPolicyCommand({
                Bucket: bucket,
                Policy: `{
                    "Version": "2012-10-17",
                    "Statement": [
                        {
                            "Sid": "PublicReadGetObject",
                            "Effect": "Allow",
                            "Principal": "*",
                            "Action": [
                                "s3:GetObject"
                            ],
                            "Resource": [
                                "arn:aws:s3:::${ bucket }/*"
                            ]
                        }
                    ]
                }`
            }))
        },
    })
}

/**
 * This function is edited from the plugin '@roadiehq/scaffolder-backend-module-aws'.
 * The action works pretty much identically to roadiehq:aws:s3:cp except it sets the ContentType
 * to 'text/html' (where it would be application/octet-stream by default) so that browsers open it properly.
 * 
 * The alternative solution would have been to upload using the Roadie action and then do a recursive in-place copy for 
 * all of the files to change their ContentType, but that would mean lots of unnecessary requests to AWS.
 */
export const createS3BucketCpHtmlAction = (options: { credentials: () => any; } | null) => {
    return createTemplateAction({
      id: "ons:aws:s3:cpHtml",
      description: "Copies the path to the given bucket and marks the ContentType as 'text/html'.",
      schema: {
        input: {
          required: ["bucket", "region"],
          type: "object",
          properties: {
            path: {
              title: "Path",
              description: "A Glob pattern that lists the files to upload. Defaults to everything in the workspace",
              type: "string"
            },
            bucket: {
              title: "Bucket",
              description: "The bucket to copy the given path",
              type: "string"
            },
            flatten: {
              title: "Flatten",
              description: "True if this action should ignore directory structure when uploading (so that files in subdirectories are placed at the bucket root)",
              type: "boolean"
            }
        }
      }
    },
      async handler(ctx) {
        if (options == null) { 
            ctx.logger.error("Did you forget to supply credentials?")
            throw new Error("handler options object is null"); 
        }
        const config = {
          ...(options == null ? void 0 : options.credentials) && {
            credentials: await options.credentials()
          },
        };

        ctx.logger.info(`Flatten setting: ${ctx.input.flatten}`);
        var _a;
        const prefix = ((_a = ctx.input) == null ? void 0 : _a.prefix) || "";
        const s3Client = new S3Client(config);
        const files = glob__default["default"].sync(
          backendCommon.resolveSafeChildPath(
            ctx.workspacePath,
            ctx.input.path ? `${ctx.input.path}/**` : "**"
          )
        ).filter((filePath: string) => fs__default["default"].lstatSync(filePath).isFile());
        try {
          await Promise.all(
            files.map((filePath: string) => {
              const cleanedPath = (prefix ? `${prefix}/` : "") + filePath.replace(`${ctx.workspacePath}/`, "")
              return s3Client.send(
                new PutObjectCommand({
                  Bucket: ctx.input.bucket?.toString(),
                  Key: ctx.input.flatten ? cleanedPath.split("/").at(-1) : cleanedPath,
                  Body: fs.createReadStream(filePath),
                  ContentType: 'text/html',
                })
              );
            })
          );
        } catch (e) {
          ctx.logger.warn("wasn't able to upload the whole context");
        }
        ctx.logger.info(
          `successfully uploaded the following file(s): \n${files.map((f: string) => f.replace(`${ctx.workspacePath}/`, "")).join("\n")}`
        );
      }
    });
  }

  export const createS3ProviderRefreshAction = () => {
    return createTemplateAction({
        id: 'ons:aws:s3:runProvider',
        description: 'Runs the catalog provider for S3 buckets, updating relevant entities.',
        schema: {},
        async handler(ctx) {
            ctx.logger.info("Running catalog S3 provider");
            try {
                await s3Manager.s3Provider.run();
            } catch (e) {
                ctx.logger.error(`Failed to run provider!? ${String(e)}`)
            }
        },
    })
  }
