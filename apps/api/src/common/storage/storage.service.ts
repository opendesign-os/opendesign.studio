import { randomUUID } from 'node:crypto'
import {
  CreateBucketCommand,
  GetObjectCommand,
  HeadBucketCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { Injectable, type OnModuleInit } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import mime from 'mime'
import type { Env } from '../../config/env'

export type Media = { data: Uint8Array; type: string }

@Injectable()
export class StorageService implements OnModuleInit {
  private readonly client: S3Client
  private readonly bucket: string

  constructor(config: ConfigService<Env, true>) {
    this.bucket = config.get('S3_BUCKET', { infer: true })
    this.client = new S3Client({
      endpoint: config.get('S3_ENDPOINT', { infer: true }),
      region: config.get('S3_REGION', { infer: true }),
      forcePathStyle: config.get('S3_PATH_STYLE', { infer: true }),
      credentials: {
        accessKeyId: config.get('S3_ACCESS_KEY', { infer: true }),
        secretAccessKey: config.get('S3_SECRET_KEY', { infer: true }),
      },
    })
  }

  async onModuleInit() {
    try {
      await this.client.send(new HeadBucketCommand({ Bucket: this.bucket }))
    } catch {
      await this.client.send(new CreateBucketCommand({ Bucket: this.bucket }))
    }
  }

  async put(tenant: string, media: Media) {
    const key = `${tenant}/${randomUUID()}.${mime.getExtension(media.type) ?? 'bin'}`
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: media.data,
        ContentType: media.type,
      }),
    )
    return key
  }

  async get(key: string): Promise<Media> {
    const result = await this.client.send(new GetObjectCommand({ Bucket: this.bucket, Key: key }))
    if (!result.Body) throw new Error(`素材 ${key} 为空`)
    return {
      data: await result.Body.transformToByteArray(),
      type: result.ContentType ?? mime.getType(key) ?? 'application/octet-stream',
    }
  }

  sign(key: string) {
    return getSignedUrl(this.client, new GetObjectCommand({ Bucket: this.bucket, Key: key }), {
      expiresIn: 3600,
    })
  }
}
