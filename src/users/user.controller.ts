import * as UserService from "./user.service";
import { createResponse } from "../common/helper/response.helper";
import asyncHandler from "express-async-handler";
import { type Request, type Response } from "express";
import { IUser } from "./user.dto";
import { sendEmail } from "../common/helper/sendEmail";
import jwt from "jsonwebtoken";
import { token } from "morgan";
/**
 * create user
 * @route POST /user/register
 * @access private
 * @returns user
 */
export const createUser = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body;
  //Check if user already exists
  const existingUser = await UserService.getUserByEmail(email);
  //if already exists then throw error
  if (existingUser) {
    throw new Error("User already exists");
  }

  const verifyTokenExpiry = new Date();
  verifyTokenExpiry.setHours(verifyTokenExpiry.getHours() + 1);

  const verifyToken = jwt.sign(
    {
      email: email,
    },
    process.env.JWT_SECRET as string
  );

  const result = await UserService.createUser({
    ...req.body,
    verifyToken,
    verifyTokenExpiry,
  });

  const mailSent = await sendEmail({
    email: email,
    emailType: "VERIFY",
    url: `http://localhost:5000/${verifyToken}`,
  });

  if (mailSent) {
    res.send(
      createResponse(
        result,
        "User Created Successfully Please Check Your Email to verify"
      )
    );
  } else {
    res.send(createResponse(result, "Error While sending Email"));
  }
});
/**
 * login user
 * @route POST /user/login
 * @access public
 * @returns user
 */
export const loginUser = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  //check if user does not exist
  const user = await UserService.getUserByEmail(email);
  //if not exist then throw an error
  if (!user) {
    throw new Error("User not found");
  }
  //check if password is valid
  const isPasswordValid = await UserService.comparePassword({
    password,
    userPassword: user.password,
  });
  //if password is not valid then throw an error
  if (!isPasswordValid) {
    throw new Error("Invalid password");
  }

  if (!user.isVerified) {
    throw new Error("Please Verify Your Account");
  }
  if (user.isBlocked) {
    throw new Error("User is Blocked");
  }
  //if password is valid then generate a token and send token in cookies to validate
  const accessToken = await UserService.generateAccessToken(
    user._id,
    user.role
  );
  const refreshToken = await UserService.generateRefreshToken(
    user._id,
    user.role
  );

  await UserService.activeUser(user._id, true);

  res
    .cookie("accessToken", accessToken)
    .cookie("refreshToken", refreshToken)
    .send(createResponse({ accessToken, refreshToken }, "Login Successfully"));
});
/**
 * Retrieves all users in the database.
 * @route GET /user/all
 * @access private
 */
export const getAllUsers = asyncHandler(async (req: Request, res: Response) => {
  //get all users from database with USER role
  const result = await UserService.getAllUsers();
  //send the response array
  res.send(createResponse(result, "Users Fetched Successfully"));
});
/**
 * @function
 * @name refreshTokens
 * @description Refreshes access token and refresh token
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @returns {Promise<void>}
 * @throws {Error} If refresh token is invalid
 */
export const refreshTokens = asyncHandler(
  async (req: Request, res: Response) => {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      throw new Error("Refresh token not found");
    }
    const response = await UserService.refreshTokens(refreshToken);
    res
      .cookie("accessToken", response.accessToken)
      .cookie("refreshToken", response.refreshToken)
      .send(createResponse(response, "Tokens Refreshed Successfully"));
  }
);
/**
 * Logs out the current user by removing their access and refresh tokens.
 * @function
 * @name logoutUser
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @returns {Promise<void>}
 */
export const logoutUser = asyncHandler(async (req: Request, res: Response) => {
  const user = await UserService.logout((req.user as IUser)?._id);

  res
    .clearCookie("accessToken")
    .clearCookie("refreshToken")
    .send(createResponse(user, "Logout Successfully"));
});
/**
 * Verifies a user by using a verify token.
 * @function
 * @name verifyUser
 * @description Verifies a user by using a verify token.
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @property {string} token - The verify token sent to the user's email.
 * @property {string} password - The password to set for the user.
 * @returns {Promise<void>}
 * @throws {Error} If the token is not found.
 * @throws {Error} If the password is not provided.
 * @throws {Error} If the user with the specific token is not found.
 * @throws {Error} If the token has expired.
 */
export const verifyUser = asyncHandler(async (req: Request, res: Response) => {
  const { token, password } = req.body;

  const user = await UserService.verifyToken(token, password);

  res.send(createResponse(user, "User Verified Successfully"));
});
/**
 * Changes the block status of a user.
 * @function
 * @name changeBlockStatus
 * @description Changes the block status of a user.
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @property {string} userId - The unique identifier of the user to block or unblock.
 * @property {boolean} isBlocked - The new block status of the user.
 * @returns {Promise<void>}
 * @throws {Error} If the user id is not provided.
 * @throws {Error} If the user is not found.
 */
export const changeBlockStatus = asyncHandler(
  async (req: Request, res: Response) => {
    const { userId, isBlocked } = req.body;

    if (!userId) {
      throw new Error("User id is required");
    }

    const user = await UserService.blockUser(userId, isBlocked);
    if (!user) {
      throw new Error("User not found");
    }
    res.send(
      createResponse(
        user,
        `user ${isBlocked ? "blocked" : "unblocked"} successfully`
      )
    );
  }
);
/**
 * Filters users based on the provided query parameters.
 * @function
 * @name filteredUser
 * @description Filters users based on the provided query parameters.
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @property {string} startDate - The start date to filter users by in ISO date format.
 * @property {string} endDate - The end date to filter users by in ISO date format.
 * @property {boolean} isActive - The active status of the users to filter by.
 * @property {boolean} isVerified - The verification status of the users to filter by.
 * @property {boolean} isKYCCompleted - The KYC completion status of the users to filter by.
 * @returns {Promise<void>}
 * @throws {Error} If no users are found.
 */
export const filteredUser = asyncHandler(
  async (req: Request, res: Response) => {
    const { startDate, endDate, isActive, isVerified, isKYCCompleted } =
      req.query;
    const filter: any = {};
    if (startDate && endDate) {
      filter.createdAt = {
        $gte: new Date(startDate.toString()),
        $lte: new Date(endDate.toString()),
      };
    }
    if (isActive) {
      filter.isActive = { $in: isActive };
    }
    if (isVerified) {
      filter.isVerified = { $in: isVerified };
    }
    if (isKYCCompleted) {
      filter.isKYCCompleted = { $in: isKYCCompleted };
    }

    const users = await UserService.filterUser(filter);

    if (!users || users?.length <= 0) {
      throw new Error("No Users Found");
    }

    res.send(createResponse(users, "users filtered successfully"));
  }
);
/**
 * Sends an email to a user.
 * @function
 * @name emailSend
 * @description Sends an email to a user with the specified email type.
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @property {string} email - The email address of the user to send the email to.
 * @property {string} emailType - The type of email to send.
 * @returns {Promise<void>}
 * @throws {Error} If the email is not sent successfully.
 */
export const emailSend = asyncHandler(async (req: Request, res: Response) => {
  const { email, emailType } = req.body;
  const url = "http://localhost:5000/verify";
  const emailSent = await UserService.resendEmail(email, emailType, url);
  if (!emailSent) {
    throw new Error("Email not sent");
  }

  res.send(createResponse({}, "Email sent successfully"));
});

/**
 * Handles forgot password functionality.
 * @function
 * @name forgotPassword
 * @description Handles forgot password functionality by generating a forgot password token and sending it to the user's email.
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @property {string} email - The email address of the user to send the email to.
 * @returns {Promise<void>}
 * @throws {Error} If the forgot password token is not generated successfully.
 */
export const forgotPassword = asyncHandler(
  async (req: Request, res: Response) => {
    const { email } = req.body;
    if (!email) {
      throw new Error("Email is required");
    }

    const forgotPasswordTokenExpiry = new Date();
    forgotPasswordTokenExpiry.setHours(
      forgotPasswordTokenExpiry.getHours() + 1
    );
    const forgotPasswordToken = jwt.sign(
      {
        email: email,
      },
      process.env.JWT_SECRET as string
    );

    const forget = await UserService.forgotPassword(
      email,
      forgotPasswordToken,
      forgotPasswordTokenExpiry
    );

    if (forget) {
      res.send(
        createResponse(forgotPasswordToken, "Email sent successfully to forgot")
      );
    } else {
      throw new Error("Error while forgot password");
    }
  }
);

/**
 * Updates the password for a user using a forgot password token.
 * @function
 * @name updatePassword
 * @description Updates the password for a user using a forgot password token.
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @property {string} token - The forgot password token.
 * @property {string} password - The new password to set for the user.
 * @returns {Promise<void>}
 * @throws {Error} If the token is not found.
 * @throws {Error} If the password is not provided.
 * @throws {Error} If the user with the specific token is not found.
 * @throws {Error} If the token has expired.
 */
export const updatePassword = asyncHandler(
  async (req: Request, res: Response) => {
    const { token, password } = req.body;
    if (!token) {
      throw new Error("Token is required");
    }
    if (!password) {
      throw new Error("password is required");
    }
    const user = await UserService.updatePassword(token, password);

    res.send(createResponse(user, "Password Updated Successfully"));
  }
);

