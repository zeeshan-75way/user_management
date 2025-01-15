import jwt from "jsonwebtoken";
import { type NextFunction, type Request, type Response } from "express";
import expressAsyncHandler from "express-async-handler";
import createHttpError from "http-errors";
import { type IUser } from "../../users/user.dto";
import process from "process";
export const roleAuth = (roles: IUser["role"][], publicRoutes: string[] = []) =>
  expressAsyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      if (publicRoutes.includes(req.path)) {
        next();
        return;
      }
      const token = req?.cookies?.accessToken;
      if (!token) {
        throw createHttpError(401, {
          message: `Invalid token`,
        });
      }
      const decodedUser = jwt.verify(token, process.env.JWT_SECRET!);

      req.user = decodedUser as IUser;
      const user = req.user as IUser;
      if (user.role == null || !["ADMIN", "USER"].includes(user.role)) {
        throw createHttpError(401, { message: "Invalid user role" });
      }
      if (!roles.includes(user.role)) {
        const type =
          user.role.slice(0, 1) + user.role.slice(1).toLocaleLowerCase();

        throw createHttpError(401, {
          message: `${type} can not access this resource`,
        });
      }
      next();
    }
  );
