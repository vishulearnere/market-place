import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

// ----------------------------------------------------------------------------
// 1. TYPE DEFINITIONS
// ----------------------------------------------------------------------------

interface JwtPayload {
  userId: string
  role: string
  isActive: boolean
  shopStatus?: string
}

// Tell TypeScript that the Express Request object might have our user payload
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload
    }
  }
}

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-development-key'

// ----------------------------------------------------------------------------
// 2. AUTHENTICATION (Who are you?)
// ----------------------------------------------------------------------------

/**
 * Verifies the JWT token and ensures the user account is active.
 * This should be applied to ALL protected routes.
 */
export const auth = (
  req: Request,
  res: Response,
  next: NextFunction,
): any => {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.',
      })
    }

    const token = authHeader.split(' ')[1]

    // Decode and verify the token
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload

    // Instantly block users who were disabled at the time the token was issued
    if (!decoded.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account is disabled. Please contact support.',
      })
    }

    // Attach the safe payload to the request for the next functions to use
    req.user = decoded
    next()
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      return res
        .status(401)
        .json({
          success: false,
          message: 'Token has expired. Please log in again.',
        })
    }
    return res.status(401).json({ success: false, message: 'Invalid token.' })
  }
}
export const requireRoles = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): any => {
    // 1. Ensure verifyToken ran first and populated req.user
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.',
      })
    }

    // 2. Check if the user's role is in the allowed list
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Requires one of: ${allowedRoles.join(', ')}`,
      })
    }

    // 3. Role matches, allow them through
    next()
  }
}

export default {auth, requireRoles} 