// src/types/express.d.ts

declare namespace Express {
  export interface Request {
    user?: {
      userId: string;
      role?: string;
      // Add other properties your user object has
    };
  }
}
