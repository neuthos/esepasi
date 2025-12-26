import {NextApiRequest, NextApiResponse} from "next";
import {v4 as uuidv4} from "uuid";
import {logRequestStart, logRequestEnd} from "../logger";
import {handleError} from "../errors/errorHandler";

type Handler = (
  req: NextApiRequest,
  res: NextApiResponse,
  requestId: string
) => Promise<void>;

/**
 * API Handler wrapper that provides:
 * - Request logging dengan ====== markers
 * - Automatic error handling (no try-catch needed)
 * - Request ID generation untuk tracing
 */
export const apiHandler = (handler: Handler) => {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const requestId = uuidv4();
    const startTime = Date.now();

    try {
      logRequestStart(requestId, req.method!, req.url!);
      await handler(req, res, requestId);
      const duration = Date.now() - startTime;
      logRequestEnd(requestId, req.method!, req.url!, res.statusCode, duration);
    } catch (error) {
      const duration = Date.now() - startTime;
      handleError(error, res, requestId);
      logRequestEnd(requestId, req.method!, req.url!, res.statusCode, duration);
    }
  };
};

/**
 * Helper to return 405 Method Not Allowed
 */
export const methodNotAllowed = (
  res: NextApiResponse,
  allowedMethods: string[]
) => {
  res.setHeader("Allow", allowedMethods);
  res.status(405).json({
    success: false,
    message: `Method not allowed. Allowed methods: ${allowedMethods.join(
      ", "
    )}`,
  });
};

/**
 * Helper to check service key for external APIs
 */
export const checkServiceKey = (req: NextApiRequest) => {
  const secretKey = process.env.EXTERNAL_SERVICE_KEY;
  const clientKey = req.headers["x-service-key"];

  return secretKey && secretKey === clientKey;
};

/**
 * Helper to return 401 Unauthorized
 */
export const unauthorized = (res: NextApiResponse) => {
  res.status(401).json({
    success: false,
    message: "Unauthorized access",
  });
};
