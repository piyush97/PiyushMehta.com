import {
  createStartHandler,
  defaultStreamHandler,
} from '@tanstack/start/server'
import { eventHandler, toWebRequest } from 'vinxi/server'

// v1.166 createStartHandler returns a handler that expects a Web API Request.
// In Vinxi dev mode the handler is called with an h3 v1 event instead, so we
// bridge via vinxi/server's toWebRequest before forwarding.
const startHandler = createStartHandler(defaultStreamHandler)

export default eventHandler(async (event) => {
  const request = toWebRequest(event)
  return startHandler(request)
})
