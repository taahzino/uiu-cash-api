import { NextFunction, Request, Response } from "express";

const validateJSON = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (
    err instanceof SyntaxError &&
    "status" in err &&
    err.status === 400 &&
    "body" in err
  ) {
    res.status(400).json({
      message: "Bad Request: Invalid JSON",
    });

    return;
  }

  next();
};

export default validateJSON;
