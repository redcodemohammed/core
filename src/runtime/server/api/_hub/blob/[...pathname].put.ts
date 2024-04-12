import { eventHandler, getValidatedRouterParams, getHeader, getRequestWebStream, getQuery } from 'h3'
import { z } from 'zod'
import { hubBlob } from '../../../utils/blob'
import { requireNuxtHubAuthorization } from '../../../utils/auth'
import { requireNuxtHubFeature } from '../../../utils/features'
import { streamToArrayBuffer } from '../../../internal/utils/stream'

export default eventHandler(async (event) => {
  await requireNuxtHubAuthorization(event)
  requireNuxtHubFeature('blob')

  const { pathname } = await getValidatedRouterParams(event, z.object({
    pathname: z.string().min(1)
  }).parse)
  const query = getQuery(event)

  const contentType = getHeader(event, 'content-type')
  const contentLength = Number(getHeader(event, 'content-length') || '0')

  const options = { ...query }
  if (!options.contentType) { options.contentType = contentType }
  if (!options.contentLength) { options.contentLength = contentLength }

  const stream = getRequestWebStream(event)!
  const body = await streamToArrayBuffer(stream, contentLength)

  return hubBlob().put(pathname, body, options)
})
