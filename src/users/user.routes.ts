import { Router } from "express";
import * as UserValidation from "./user.validation";
import * as UserController from "./user.controller";
import { catchError } from "../common/middleware/catch-error.middleware";
import { roleAuth } from "../common/middleware/role-auth.middleware";
const router = Router();

router
  .post(
    "/register",
    roleAuth(["ADMIN"]),
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
  .get("/refresh", UserController.refreshTokens)
  .patch("/verify", UserController.verifyUser)
  .patch("/logout", roleAuth(["USER", "ADMIN"]), UserController.logoutUser)
  .patch(
    "/block-unblock",
    roleAuth(["ADMIN"]),
    UserController.changeBlockStatus
  )
  .get("/users", UserController.filteredUser)
  .post("/send-email", UserController.emailSend)
  .post("/forgot-password", UserController.forgotPassword)
  .patch("/update-password", UserController.updatePassword);

export default router;
