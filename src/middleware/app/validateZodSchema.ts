import { NextFunction, Request, Response } from "express";
import { z, ZodSchema } from "zod";
import {
  formatZodErrors,
  sendResponse,
  sendServerError,
  STATUS_BAD_REQUEST,
} from "../../utilities/response";

type RequestSource = "body" | "query" | "params";

const validateZodSchema = <T>(
  schema: z.ZodType<T>,
  source: RequestSource = "body"
) => {
  return async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const sourceData = req[source];
      const result = schema.safeParse(sourceData);

      if (!result.success) {
        sendResponse(res, STATUS_BAD_REQUEST, {
          message: "You have some errors in your request",
          errors: formatZodErrors(result.error.issues),
        });
        return;
      }

      res.locals[source] = result.data;

      next();
    } catch (error) {
      sendServerError(res, error);
    }
  };
};

export default validateZodSchema;
