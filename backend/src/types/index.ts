export type UserRole = "jobseeker" | "recruiter" | "admin";

export interface AccessTokenPayload {
  userId: string;
  role: UserRole;
}

export interface RefreshTokenPayload {
  userId: string;
  tokenVersion: number;
}
