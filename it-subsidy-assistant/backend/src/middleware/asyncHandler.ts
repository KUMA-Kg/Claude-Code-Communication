import { Request, Response, NextFunction } from 'express';

/**
 * 非同期ハンドラーのラッパー
 * async/awaitを使用したルートハンドラーでのエラーをキャッチ
 */
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};