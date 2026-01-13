import { NextFunction, Request, Response } from "express";
import { ZodError, ZodSchema } from "zod";

/**
 * Zod validation middleware
 * Validates request body, query, and params against a Zod schema
 */
export const validateRequest = (schema: ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.issues.map((err) => ({
          field: err.path.join("."),
          message: err.message,
        }));

        res.status(400).json({
          message: "Validation failed",
          errors,
        });
        return;
      }

      res.status(500).json({
        message: "Internal server error during validation",
      });
    }
  };
};
