import {
  createStartHandler,
  defaultStreamHandler,
} from '@tanstack/start/server'

// v1.166 API: createStartHandler is not curried — pass the handler directly.
// The router is loaded via the #tanstack-router-entry virtual module.
export default createStartHandler(defaultStreamHandler)
