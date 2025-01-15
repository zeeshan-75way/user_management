import { Router } from "express";
import * as UserValidation from "./user.validation";
import * as UserController from "./user.controller";
import { catchError } from "../common/middleware/catch-error.middleware";
import { roleAuth } from "../common/middleware/role-auth.middleware";
const router = Router();

router
  .post(
    "/register",
    UserValidation.createUser,
    catchError,
    UserController.createUser
  )
  .post(
    "/login",
    UserValidation.loginUser,
    catchError,
    UserController.loginUser
  )
  .get("/all", roleAuth(["ADMIN"]), UserController.getAllUsers)
  .get("/refresh",  UserController.refreshTokens)
  .patch("/logout", roleAuth(["USER","ADMIN"]), UserController.logoutUser);

export default router;
