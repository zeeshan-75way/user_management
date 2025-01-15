import { type IUser } from "./user.dto";
import UserSchema from "./user.schema";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
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

export const logout = async function (_id: string) {
  const user = await UserSchema.findByIdAndUpdate(
    { _id },
    {
      $unset: {
        refreshToken: 1,
      },
    },
    { new: true }
  ).select("-password");
  return user;
};
