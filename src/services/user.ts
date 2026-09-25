import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { prisma } from '../lib/prisma.js'
// Import types from your generated Prisma output
import { Role, Prisma,ShopStatus } from '../generated/prisma/client.js'

// Define the expected return type for our service methods
export interface ServiceResponse<T = any> {
  status: number
  success: boolean
  message: string
  data?: T
  token?: string
}

export class UserService {
  private readonly saltRounds = 12
  private readonly jwtSecret =
    process.env.JWT_SECRET || 'super-secret-development-key'

 
  async signup(data: any): Promise<ServiceResponse> {
    try {
      const email = data.email.toLowerCase().trim()
      const { password, role } = data
      
      const allowedRoles = ['CUSTOMER', 'VENDOR']
      if (!allowedRoles.includes(role)) {
        return {
          status: 403, // 403 Forbidden or 400 Bad Request
          success: false,
          message:
            'Invalid role. Only CUSTOMER or VENDOR accounts can be registered via this endpoint.',
        }
      }

      // 1. Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email },
      })

      if (existingUser) {
        return {
          status: 409, // 409 Conflict
          success: false,
          message: 'An account with this email already exists',
        }
      }

      // 2. Hash the password securely
      const passwordHash = await bcrypt.hash(password, this.saltRounds)

      // 3. Create the user in the database
      // We use `select` to guarantee the passwordHash is NEVER returned to the frontend
      const isVendor = role === 'VENDOR'
      const newUser = await prisma.user.create({
        data: {
          email,
          passwordHash,
          role: role as Role,
          shop: isVendor
            ? {
                create: {
                  name: `${email}'s Shop`, // A placeholder name they can change later
                  latitude: 0,
                  longitude: 0,
                  status: 'PENDING', // The default status from your enum
                },
              }
            : undefined,
        },
        select: {
          id: true,
          email: true,
          role: true,
          isActive: true,
          shop: {
            select: {
              id: true,
              status: true,
            },
          },
        },
      })

      return {
        status: 201, // 201 Created
        success: true,
        message: 'User registered successfully',
        data: newUser,
      }
    } catch (error: any) {
      console.error('UserService.signup Error:', error)
      return {
        status: 500,
        success: false,
        message: 'Internal server error during signup',
      }
    }
  }

  /**
   * Handle User Login
   */
  async login(data: any): Promise<ServiceResponse> {
    try {
      const email = data.email.toLowerCase().trim()
      const { password } = data

      // 1. Find the user by email
      const user = await prisma.user.findUnique({
        where: { email },
        include: { shop: { select: { status: true, id: true } } },
      })
      if (!user || !user.isActive) {
        return {
          status: 401,
          success: false,
          message: 'Account is disabled or invalid',
        }
      }

      // 2. Verify the password matches the hash
      const isPasswordValid = await bcrypt.compare(password, user.passwordHash)

      if (!isPasswordValid) {
        return {
          status: 401,
          success: false,
          message: 'Invalid email or password', // Keep error generic for security
        }
      }

      const token = jwt.sign(
        {
          userId: user.id,
          role: user.role,
          isActive: user.isActive,
          shopStatus: user.shop?.status,
          shopID: user.shop?.id,
        },
        this.jwtSecret,
        { expiresIn: '24h' },
      )

      return {
        status: 200,
        success: true,
        message: 'Login successful',
        token, // Send token to client
        data: {
          id: user.id,
          email: user.email,
          role: user.role,
          isActivate: user.isActive,
          shopStatus: user.shop?.status,
        },
      }
    } catch (error: any) {
      console.error('UserService.login Error:', error)
      return {
        status: 500,
        success: false,
        message: 'Internal server error during login',
      }
    }
  }

 
  async getAllVendors(queryParams?: any): Promise<ServiceResponse> {
    try {
      // You can expand this later to use queryParams for pagination (skip/take)
      const vendors = await prisma.user.findMany({
        where: {
          role: 'VENDOR',
        },
        select: {
          id: true,
          email: true,
          role: true,
          createdAt: true,
          shop: {
            select: {
              id: true,
              name: true,
              status: true, // PENDING, APPROVED, REJECTED, DISABLED
            },
          },
        },
      })

      return {
        status: 200,
        success: true,
        message: 'Vendors retrieved successfully',
        data: vendors,
      }
    } catch (error: any) {
      console.error('UserService.getAllVendors Error:', error)
      return {
        status: 500,
        success: false,
        message: 'Internal server error while fetching vendors',
      }
    }
  }


  async updateVendorStatus(
    vendorID: string,
    status: string,
  ): Promise<ServiceResponse> {
    try {
      // 1. Verify the user exists and is actually a vendor
      const vendor = await prisma.user.findUnique({
        where: { id: vendorID },
      })

      if (!vendor || vendor.role == 'ADMIN') {
        return {
          status: 404,
          success: false,
          message: 'Vendor not found or user is not a admin',
        }
      }
      // 2. Update the vendor
      const updatedVendor = await prisma.shop.update({
        where: { ownerId: vendorID },
        data: {
          status: status as ShopStatus, // This assumes you have a 'status' field in your Prisma schema
        },
      })

      return {
        status: 200,
        success: true,
        message: `Vendor status successfully updated to ${status}`,
        data: updatedVendor,
      }
    } catch (error: any) {
      console.error('UserService.updateVendorStatus Error:', error)
      return {
        status: 500,
        success: false,
        message: 'Internal server error while updating vendor status',
      }
    }
  }

  async disableVendor(vendorID: string): Promise<ServiceResponse> {
    try {
      // 1. Verify the vendor exists
      const vendor = await prisma.user.findUnique({
        where: { id: vendorID },
      })

      if (!vendor || vendor.role !== 'VENDOR') {
        return {
          status: 404,
          success: false,
          message: 'Vendor not found',
        }
      }

      // 2. Set the vendor to disabled
      const [disabledUser, disabledShop] = await prisma.$transaction([
        // 1. Lock the user out of logging in
        prisma.user.update({
          where: { id: vendorID },
          data: { isActive: false },
          select: {
            id: true,
            email: true,
            role: true,
            isActive: true,
          },
        }),
        // 2. Take their shop offline
        prisma.shop.update({
          where: { ownerId: vendorID },
          data: { status: 'DISABLED' },
        }),
      ])

      return {
        status: 200,
        success: true,
        message: 'Vendor account successfully disabled',
        data: { disabledUser, disabledShop },
      }
    } catch (error: any) {
      console.error('UserService.disableVendor Error:', error)
      return {
        status: 500,
        success: false,
        message: 'Internal server error while disabling vendor',
      }
    }
  }
}
