declare global {
  namespace Express {
    interface Request {
      admin?: {
        email: string;
      };
    }
  }
}

export {};
