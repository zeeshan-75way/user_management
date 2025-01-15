import { type BaseSchema } from "../common/dto/base.dto";

export interface IUser extends BaseSchema {
  name: string;
  email: string;
  password: string;
  isActive: boolean;
  isBlocked: boolean;
  isKYCCompleted: boolean;
  is2FAEnabled: boolean;
  isVerified: boolean;
  role: "ADMIN" | "USER";
  refreshToken?: string;
  verifyToken: string;
  verifyTokenExpiry: Date | "";
  forgotPasswordToken: string;
  forgotPasswordTokenExpiry: Date | "";
}
