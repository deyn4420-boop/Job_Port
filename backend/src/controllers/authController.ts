import { Request, Response } from "express";
import { User } from "../models/User";
import { registerSchema, loginSchema } from "../utils/validation";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  REFRESH_COOKIE_NAME,
  refreshCookieOptions,
} from "../utils/tokens";
import { AuthRequest } from "../middleware/auth";

export async function register(req: Request, res: Response) {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Validation failed", errors: parsed.error.flatten() });
  }

  const { name, email, password, role } = parsed.data;

  const existing = await User.findOne({ email });
  if (existing) {
    return res.status(409).json({ message: "An account with this email already exists" });
  }

  const user = await User.create({ name, email, password, role });

  const accessToken = signAccessToken({ userId: user._id.toString(), role: user.role });
  const refreshToken = signRefreshToken({ userId: user._id.toString(), tokenVersion: user.tokenVersion });

  res.cookie(REFRESH_COOKIE_NAME, refreshToken, refreshCookieOptions);

  return res.status(201).json({
    accessToken,
    user: { id: user._id, name: user.name, email: user.email, role: user.role },
  });
}

export async function login(req: Request, res: Response) {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Validation failed", errors: parsed.error.flatten() });
  }

  const { email, password } = parsed.data;

  // password field has select:false in the schema, so explicitly request it
  const user = await User.findOne({ email }).select("+password");
  if (!user || !(await user.comparePassword(password))) {
    // Same message for both cases — don't leak which part was wrong
    return res.status(401).json({ message: "Invalid email or password" });
  }

  const accessToken = signAccessToken({ userId: user._id.toString(), role: user.role });
  const refreshToken = signRefreshToken({ userId: user._id.toString(), tokenVersion: user.tokenVersion });

  res.cookie(REFRESH_COOKIE_NAME, refreshToken, refreshCookieOptions);

  return res.json({
    accessToken,
    user: { id: user._id, name: user.name, email: user.email, role: user.role },
  });
}

export async function refresh(req: Request, res: Response) {
  const token = req.cookies?.[REFRESH_COOKIE_NAME];
  if (!token) {
    return res.status(401).json({ message: "No refresh token" });
  }

  try {
    const payload = verifyRefreshToken(token);
    const user = await User.findById(payload.userId);

    if (!user || user.tokenVersion !== payload.tokenVersion) {
      // tokenVersion mismatch = token was revoked (e.g. after logout-all or password change)
      return res.status(401).json({ message: "Refresh token is no longer valid" });
    }

    const accessToken = signAccessToken({ userId: user._id.toString(), role: user.role });

    // Rotate the refresh token on every use — limits damage if one is ever stolen
    const newRefreshToken = signRefreshToken({ userId: user._id.toString(), tokenVersion: user.tokenVersion });
    res.cookie(REFRESH_COOKIE_NAME, newRefreshToken, refreshCookieOptions);

    return res.json({ accessToken });
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired refresh token" });
  }
}

export async function logout(req: Request, res: Response) {
  res.clearCookie(REFRESH_COOKIE_NAME, { path: "/api/auth" });
  return res.status(204).send();
}

export async function me(req: AuthRequest, res: Response) {
  const user = await User.findById(req.user!.userId);
  if (!user) return res.status(404).json({ message: "User not found" });

  return res.json({
    user: { id: user._id, name: user.name, email: user.email, role: user.role },
  });
}
