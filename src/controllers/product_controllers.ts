import { Request, Response, NextFunction } from 'express'
import Joi from 'joi'
import { ProductService } from '../services/product.js'


const createProductSchema = Joi.object({
  title: Joi.string().trim().required(),
  imageUrl: Joi.string().uri().optional().allow(null, ''),
  price: Joi.number().positive().precision(2).required(),
  isAvailable: Joi.boolean().optional(),
})

const updateProductSchema = Joi.object({
  title: Joi.string().trim().optional(),
  imageUrl: Joi.string().uri().optional().allow(null, ''),
  price: Joi.number().positive().precision(2).optional(),
  isAvailable: Joi.boolean().optional(),
}).min(1) // Ensure at least one field is being updated


export const createProduct = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { error, value } = createProductSchema.validate(req.body, {
      abortEarly: false,
    })
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation Error',
        errors: error.details.map((err) => err.message),
      })
    }
    const productSvc = new ProductService()
    // req.user is guaranteed to exist because of the verifyToken middleware
    const result = await productSvc.createProduct(req.user!.userId, value)

    return res.status(result.status).json({ ...result })
  } catch (error) {
    console.error('Error in createProduct controller:', error)
    next(error)
  }
}

export const getProductsByShopID = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const  shopId  = req.params.shopID as string
    const productSvc = new ProductService()

    const result = await productSvc.getProductsByShop(shopId)

    return res.status(result.status).json({ ...result })
  } catch (error) {
    console.error('Error in getProduct controller:', error)
    next(error)
  }
}

export const updateProduct = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const productID  = req.params.productID as string

    const { error, value } = updateProductSchema.validate(req.body, {
      abortEarly: false,
    })
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation Error',
        errors: error.details.map((err) => err.message),
      })
    }

    const productSvc = new ProductService()
    const result = await productSvc.updateProduct(
      req.user!.userId,
      productID,
      value,
    )

    return res.status(result.status).json({ ...result })
  } catch (error) {
    console.error('Error in updateProduct controller:', error)
    next(error)
  }
}

export const deleteProduct = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const productID  = req.params.productID as string
    const productSvc = new ProductService()
    const result = await productSvc.deleteProduct(req.user!.userId, productID)

    return res.status(result.status).json({ ...result })
  } catch (error) {
    console.error('Error in deleteProduct controller:', error)
    next(error)
  }
}