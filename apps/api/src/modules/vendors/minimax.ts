import type {
  ImageModelV4File as ImageFile,
  ImageModelV4 as ImageModel,
  Experimental_VideoModelV4File as VideoFile,
  Experimental_VideoModelV4 as VideoModel,
} from '@ai-sdk/provider'
import { APICallError } from '@ai-sdk/provider'
import {
  combineHeaders,
  convertUint8ArrayToBase64,
  createJsonErrorResponseHandler,
  createJsonResponseHandler,
  encodePathSegment,
  getFromApi,
  postJsonToApi,
} from '@ai-sdk/provider-utils'
import { z } from 'zod'
import type { Access } from './protocols'

const failure = createJsonErrorResponseHandler({
  errorSchema: z.object({ error: z.object({ message: z.string() }) }),
  errorToMessage: (data) => data.error.message,
})

const created = z.object({ task_id: z.string() })

const progress = z.object({
  task: z.object({
    status: z.string(),
    content: z.object({ url: z.string() }).nullish(),
    error: z.object({ message: z.string() }).nullish(),
  }),
})

const verdict = z.object({ status_code: z.number(), status_msg: z.string() })

const drawn = z.object({
  data: z.object({ image_base64: z.array(z.string()).nullish() }).nullish(),
  base_resp: verdict,
})

const shapes = ['1:1', '16:9', '4:3', '3:2', '2:3', '3:4', '9:16']

function root(access: Access) {
  return access.endpoint.replace(/\/+$/, '')
}

function headers(access: Access, extra?: Record<string, string | undefined>) {
  return combineHeaders({ authorization: `Bearer ${access.key}` }, extra)
}

function refuse(url: string, body: unknown, result: z.infer<typeof verdict>, raw: unknown): never {
  throw new APICallError({
    message: result.status_msg,
    url,
    requestBodyValues: body,
    responseBody: JSON.stringify(raw),
    isRetryable: result.status_code === 1002,
  })
}

function source(file: VideoFile | ImageFile) {
  if (file.type === 'url') return file.url
  const data = typeof file.data === 'string' ? file.data : convertUint8ArrayToBase64(file.data)
  return `data:${file.mediaType};base64,${data}`
}

function ratio(shape: string) {
  const [width = 1, height = 1] = shape.split(':').map(Number)
  return width / height
}

function shape(model: string, size: string | undefined) {
  const [width = 1024, height = 1024] = size ? size.split('x').map(Number) : []
  if (model === 'image-01') {
    const scale = Math.min(1, 2048 / Math.max(width, height))
    const fit = (value: number) => Math.max(512, Math.round((value * scale) / 8) * 8)
    return { width: fit(width), height: fit(height) }
  }
  const target = width / height
  const closest = shapes.reduce((best, item) =>
    Math.abs(ratio(item) - target) < Math.abs(ratio(best) - target) ? item : best,
  )
  return { aspect_ratio: closest }
}

function quality(model: string, resolution: string | undefined) {
  const [width = 0, height = 0] = (resolution ?? '').split('x').map(Number)
  return model === 'MiniMax-H3' && Math.min(width, height) >= 1080 ? '2K' : '768P'
}

export function video(access: Access, model: string): VideoModel {
  const response = (responseHeaders?: Record<string, string>) => ({
    timestamp: new Date(),
    modelId: model,
    headers: responseHeaders,
  })
  return {
    specificationVersion: 'v4',
    provider: 'minimax.video',
    modelId: model,
    maxVideosPerCall: 1,
    async doStart(options) {
      const frames =
        options.frameImages ??
        (options.image ? [{ image: options.image, frameType: 'first_frame' as const }] : [])
      const { value, responseHeaders } = await postJsonToApi({
        url: `${root(access)}/v2/video_generation`,
        headers: headers(access, options.headers),
        body: {
          model,
          content: [
            { type: 'text', text: options.prompt ?? '' },
            ...frames.map((frame) => ({
              type: 'image_url',
              image_url: { url: source(frame.image) },
              role: frame.frameType,
            })),
          ],
          resolution: quality(model, options.resolution),
          duration: options.duration,
          ratio: options.aspectRatio,
        },
        successfulResponseHandler: createJsonResponseHandler(created),
        failedResponseHandler: failure,
        abortSignal: options.abortSignal,
      })
      return { operation: value.task_id, warnings: [], response: response(responseHeaders) }
    },
    async doStatus(options) {
      const { value, responseHeaders } = await getFromApi({
        url: `${root(access)}/v2/query/video_generation/${encodePathSegment(String(options.operation))}`,
        headers: headers(access, options.headers),
        successfulResponseHandler: createJsonResponseHandler(progress),
        failedResponseHandler: failure,
        abortSignal: options.abortSignal,
      })
      const { status, content, error } = value.task
      if (status === 'succeeded' && content) {
        return {
          status: 'completed',
          videos: [{ type: 'url', url: content.url, mediaType: 'video/mp4' }],
          warnings: [],
          response: response(responseHeaders),
        }
      }
      if (status === 'failed' || status === 'cancelled') {
        return {
          status: 'error',
          error: error?.message ?? 'MiniMax 视频生成失败',
          response: response(responseHeaders),
        }
      }
      return { status: 'pending', response: response(responseHeaders) }
    },
  }
}

export function image(access: Access, model: string): ImageModel {
  return {
    specificationVersion: 'v4',
    provider: 'minimax.image',
    modelId: model,
    maxImagesPerCall: 9,
    supportsFileInputs: true,
    async doGenerate(options) {
      const url = `${root(access)}/v1/image_generation`
      const [reference, ...rest] = options.files ?? []
      const body = {
        model,
        prompt: options.prompt ?? '',
        ...shape(model, options.size),
        n: options.n,
        seed: options.seed,
        response_format: 'base64',
        subject_reference: reference && [{ type: 'character', image_file: source(reference) }],
      }
      const { value, responseHeaders, rawValue } = await postJsonToApi({
        url,
        headers: headers(access, options.headers),
        body,
        successfulResponseHandler: createJsonResponseHandler(drawn),
        failedResponseHandler: failure,
        abortSignal: options.abortSignal,
      })
      const images = value.data?.image_base64 ?? []
      if (value.base_resp.status_code !== 0) refuse(url, body, value.base_resp, rawValue)
      if (!images.length) {
        refuse(url, body, { status_code: 1026, status_msg: '图片没有通过内容安全审核' }, rawValue)
      }
      return {
        images,
        warnings: rest.length
          ? [{ type: 'compatibility', feature: 'files', details: 'MiniMax 只用第一张参考图' }]
          : [],
        response: { timestamp: new Date(), modelId: model, headers: responseHeaders },
      }
    },
  }
}
