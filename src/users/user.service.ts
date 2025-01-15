import { type IUser } from "./user.dto";
import UserSchema from "./user.schema";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { sendEmail } from "../common/helper/sendEmail";
/**
 * Creates a new user.
 * @param data - The user data to create the user with.
 * @returns A promise that resolves to the newly created user object.
 */
export const createUser = async (data: IUser) => {
  const result = await UserSchema.create({ ...data });
  return result;
};
/**
 * Retrieves a user by their email address.
 * @param email - The email address of the user to retrieve.
 * @returns A promise that resolves to the user object if found, or null if not found.
 */

export const getUserByEmail = async (email: string) => {
  const result = await UserSchema.findOne({ email: email }).lean();
  return result;
};

/**
 * Retrieves all users in the database.
 * @returns A promise that resolves to an array of user objects without their passwords.
 */
export const getAllUsers = async () => {
  const result = await UserSchema.find({ role: "USER" })
    .select("-password")
    .lean();
  return result;
};

/**
 * Generates a JSON Web Token for a user.
 * @param _id - The user's unique identifier.
 * @param role - The user's role.
 * @returns A JSON Web Token.
 */
export const generateAccessToken = async function (_id: string, role: string) {
  const token = jwt.sign(
    { _id: _id, role: role },
    process.env.JWT_SECRET as string,
    {
      expiresIn: process.env.JWT_ACCESS_TOKEN_EXPIRY,
    }
  );
  return token;
};
/**
 * Generates a JSON Web Token for a user.
 * @param _id - The user's unique identifier.
 * @param role - The user's role.
 * @returns A JSON Web Token.
 */
export const generateRefreshToken = async function (_id: string, role: string) {
  const token = jwt.sign(
    { _id: _id, role: role },
    process.env.JWT_SECRET as string,
    {
      expiresIn: process.env.JWT_REFRESH_TOKEN_EXPIRY,
    }
  );
  const user = await UserSchema.findByIdAndUpdate(
    { _id: _id },
    { refreshToken: token },
    {
      new: true,
    }
  );
  console.log(user);
  return token;
};
/**
 * Compares a plaintext password with a hashed password.
 * @param password - The plaintext password to compare.
 * @param userPassword - The hashed password to compare with.
 * @returns A promise that resolves to a boolean value indicating whether the passwords match.
 */
export const comparePassword = async ({
  password,
  userPassword,
}: {
  password: string;
  userPassword: string;
}) => {
  return await bcrypt.compare(password, userPassword);
};

/**
 * Refreshes an access token and a refresh token for a user based on a given refresh token.
 * @param token - The refresh token to use to refresh the access token and refresh token.
 * @returns A promise that resolves to an object containing the new access token and refresh token.
 * @throws {Error} If the refresh token is invalid.
 * @throws {Error} If the user is not found.
 */
export const refreshTokens = async function (token: string) {
  const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as IUser;

  if (!decoded) {
    throw new Error("Invalid token");
  }
  const user = await UserSchema.findById(decoded._id);
  if (!user) {
    throw new Error("User not found");
  }
  const accessToken = await generateAccessToken(user._id.toString(), user.role);
  const refreshToken = await generateRefreshToken(user._id, user.role);

  return { accessToken, refreshToken };
};

/**
 * Logs out a user by removing their refresh token.
 * @param _id - The unique identifier of the user to log out.
 * @returns A promise that resolves to the user object without their password after logging out.
 * @throws {Error} If the user is not found.
 */
export const logout = async function (_id: string) {
  const user = await UserSchema.findByIdAndUpdate(
    { _id },
    {
      $unset: {
        refreshToken: 1,
      },
      isActive: false,
    },
    { new: true }
  ).select("-password");
  return user;
};

/**
 * Verifies a user by using a verify token.
 * @param token - The verify token sent to the user's email.
 * @param password - The password to set for the user.
 * @returns A promise that resolves to the user object after verification.
 * @throws {Error} If the token is not found.
 * @throws {Error} If the password is not provided.
 * @throws {Error} If the user with the specific token is not found.
 * @throws {Error} If the token has expired.
 */
export const verifyToken = async function (token: string, password: string) {
  if (!token) {
    throw new Error("Token not found");
  }
  if (!password) {
    throw new Error("Password is required");
  }

  const user = await UserSchema.findOne({ verifyToken: token }).select(
    "-password"
  );
  if (!user) {
    throw new Error("User with specific token not found");
  }
  const date = new Date();

  if (date > user.verifyTokenExpiry) {
    throw new Error("Token Expired");
  }

  user.isVerified = true;
  user.verifyToken = "";
  user.password = password;
  user.verifyTokenExpiry = "";
  await user.save({ validateBeforeSave: true });

  return user;
};

/**
 * Blocks or unblocks a user.
 * @param _id - The unique identifier of the user to block or unblock.
 * @param isBlocked - A boolean indicating whether to block or unblock the user.
 * @returns A promise that resolves to the user object after update.
 * @throws {Error} If the user id is not provided.
 */
export const blockUser = async function (_id: string, isBlocked: boolean) {
  if (!_id) {
    throw new Error("user id is required");
  }
  const user = await UserSchema.findByIdAndUpdate(
    { _id: _id },
    { isBlocked: isBlocked },
    { new: true, runValidators: true }
  ).select("-password");

  return user;
};

/**
 * Retrieves a list of users based on a given filter.
 * @param filter - An object with the properties to filter the users by.
 * @returns A promise that resolves to an array of user objects without their passwords.
 */
export const filterUser = async function (filter: IUser) {
  const user = await UserSchema.find(filter).select("-password");
  return user;
};

/**
 * Activates or deactivates a user.
 * @param _id - The unique identifier of the user to activate or deactivate.
 * @param isActive - A boolean indicating whether to activate or deactivate the user.
 * @returns A promise that resolves to the user object after update.
 * @throws {Error} If the user id is not provided.
 */
export const activeUser = async function (_id: string, isActive: boolean) {
  const user = await UserSchema.findByIdAndUpdate(
    _id,
    { isActive: isActive },
    { new: true }
  ).select("-password");
  return user;
};

/**
 * Resends an email to the user.
 * @param email - The email address of the user to resend the email to.
 * @param emailType - The type of email to resend.
 * @param url - The url to include in the email.
 * @returns A promise that resolves to a boolean indicating whether the email was sent successfully.
 */
export const resendEmail = async function (
  email: string,
  emailType: string,
  url: string
) {
  const mailSent = await sendEmail({
    email: email,
    emailType: emailType,
    url: url,
  });

  return mailSent;
};

/**
 * Sends a forgot password email with a token to the user.
 * @param email - The email address of the user to send the forgot password email to.
 * @param forgotPasswordToken - The token to include in the forgot password email.
 * @param forgotPasswordTokenExpiry - The expiry date and time for the forgot password token.
 * @returns A promise that resolves to a boolean indicating whether the email was sent successfully.
 * @throws {Error} If the user is not found.
 */

export const forgotPassword = async function (
  email: string,
  forgotPasswordToken: string,
  forgotPasswordTokenExpiry: Date | ""
) {
  const user = await UserSchema.findOne({email});
  if (!user) {
    throw new Error("User not found");
  }
  user.forgotPasswordToken = forgotPasswordToken;
  user.forgotPasswordTokenExpiry = forgotPasswordTokenExpiry;

  await user.save();
  const url = `http://localhost:5000/${forgotPasswordToken}`;

  const mailSent = await resendEmail(email, "FORGETPASSWORD", url);
  return mailSent;
};
/**
 * Updates the password for a user using a forgot password token.
 * @param token - The forgot password token used to identify the user.
 * @param password - The new password to set for the user.
 * @returns A promise that resolves to the user object after the password is updated.
 * @throws {Error} If the token is not found.
 * @throws {Error} If the password is not provided.
 * @throws {Error} If the user with the specific token is not found.
 * @throws {Error} If the token has expired.
 */

export const updatePassword = async function (token: string, password: string) {
  if (!token) {
    throw new Error("Token not found");
  }
  if (!password) {
    throw new Error("Password is required");
  }
  const user = await UserSchema.findOne({ forgotPasswordToken: token }).select(
    "-password"
  );
  if (!user) {
    throw new Error("User with specific token not found");
  }
  const date = new Date();

  if (date > user.forgotPasswordTokenExpiry) {
    throw new Error("Token Expired");
  }

  user.forgotPasswordToken = "";
  user.password = password;
  user.forgotPasswordTokenExpiry = "";
  await user.save({ validateBeforeSave: true });

  return user;
};
