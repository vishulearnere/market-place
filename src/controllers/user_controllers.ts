import { Request, Response, NextFunction } from 'express'
import { UserService } from '../services/user.js'

export const signup = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { email, password, role } = req.body
    const userSvc = new UserService()

    const result = await userSvc.signup({ email, password, role })

    return res.status(result.status).json({
      ...result,
    })
  } catch (error) {
    console.error('Error in signup controller:', error)
    next(error)
  }
}

export const loginUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { email, password } = req.body
    const userSvc = new UserService()

    const result = await userSvc.login({ email, password })

    return res.status(result.status).json({
      ...result,
    })
  } catch (error) {
    console.error('Error in login controller:', error)
    next(error)
  }
}

export const getAllVendors = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userSvc = new UserService()

    const result = await userSvc.getAllVendors(req.query)

    return res.status(result.status).json({
      ...result,
    })
  } catch (error) {
    console.error('Error in getAllVendors controller:', error)
    next(error)
  }
}

export const updateVendor = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const  vendorID  = req.params.vendorID as string
    const { status } = req.body

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required',
      })
    }

    const userSvc = new UserService()
    const result = await userSvc.updateVendorStatus(vendorID, status)

    return res.status(result.status).json({
      ...result,
    })
  } catch (error) {
    console.error('Error in updateVendor controller:', error)
    next(error)
  }
}

export const disableVendor = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const  vendorID  = req.params.vendorID as string

    const userSvc = new UserService()
    const result = await userSvc.disableVendor(vendorID)

    return res.status(result.status).json({
      ...result,
    })
  } catch (error) {
    console.error('Error in disableVendor controller:', error)
    next(error)
  }
}
