import { ZodError, ZodSchema } from "zod";
import type { Request, Response, NextFunction } from "express";

interface ValidationSchemas {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}

export function validate(schemas: ValidationSchemas) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const errors: Record<string, unknown> = {};

    try {
      if (schemas.body) {
        req.body = schemas.body.parse(req.body);
      }
    } catch (error) {
      if (error instanceof ZodError) {
        errors.body = formatZodErrors(error);
      }
    }

    try {
      if (schemas.query) {
        req.query = schemas.query.parse(req.query) as typeof req.query;
      }
    } catch (error) {
      if (error instanceof ZodError) {
        errors.query = formatZodErrors(error);
      }
    }
    try {
      if (schemas.params) {
        req.params = schemas.params.parse(req.params) as typeof req.params;
      }
    } catch (error) {
      if (error instanceof ZodError) {
        errors.body = formatZodErrors(error);
      }
    }

    if (Object.keys(errors).length > 0) {
      res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Request validation failed",
          details: errors,
        },
      });
      return;
    }

    next();
  };
}

/**
 * Format a ZodError into a clean, client-friendly structure.
 *
 * INPUT (ZodError.issues):
 *   [
 *     { path: ["longUrl"], message: "Must be a valid URL" },
 *     { path: ["longUrl"], message: "Must use HTTP or HTTPS" },
 *     { path: ["expiresAt"], message: "Must be a future date" },
 *   ]
 *
 * OUTPUT:
 *   {
 *     "longUrl": ["Must be a valid URL", "Must use HTTP or HTTPS"],
 *     "expiresAt": ["Must be a future date"]
 *   }
 */

function formatZodErrors(error: ZodError): Record<string, string[]> {
  const formattedErrors: Record<string, string[]> = {};

  for (const issue of error.issues) {
    const key = issue.path.length > 0 ? issue.path.join(".") : "_root";

    if (!formattedErrors[key]) {
      formattedErrors[key] = [];
    }
    formattedErrors[key].push(issue.message);
  }

  return formattedErrors;
}
