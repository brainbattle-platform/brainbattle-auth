/**
 * Standardized auth response format for Flutter frontend
 */
export class AuthResponseDto {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  data: {
    userId: string;
    displayName: string | null;
    avatarUrl: string | null;
  };
}

/**
 * Error response format
 */
export class ErrorResponseDto {
  error: {
    code: string;
    message: string;
    details?: any;
  };
}
