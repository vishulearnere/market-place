import { prisma } from '../lib/prisma.js'

export interface ServiceResponse<T = any> {
  status: number
  success: boolean
  message: string
  data?: T
}

export class ProductService {
  /**
   * Helper to ensure the vendor actually owns the product they are trying to modify
   */
  private async verifyProductOwnership(vendorId: string, productId: string) {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { shop: true },
    })

    if (!product || product.isDeleted) {
      return { error: 'Product not found', status: 404 }
    }

    if (product.shop.ownerId !== vendorId) {
      return {
        error: 'You do not have permission to modify this product',
        status: 403,
      }
    }

    return { product }
  }

  async createProduct(vendorId: string, data: any): Promise<ServiceResponse> {
    try {
      // Find the shop belonging to this vendor
      const shop = await prisma.shop.findUnique({
        where: { ownerId: vendorId },
      })

      if (!shop) {
        return { status: 404, success: false, message: 'Vendor shop not found' }
      }

      const product = await prisma.product.create({
        data: {
          shopId: shop.id,
          title: data.title,
          imageUrl: data.imageUrl,
          price: data.price,
          isAvailable: data.isAvailable ?? true, // Defaults to true if not provided
        },
      })

      return {
        status: 201,
        success: true,
        message: 'Product created successfully',
        data: product,
      }
    } catch (error) {
      console.error('ProductService.create Error:', error)
      return {
        status: 500,
        success: false,
        message: 'Internal server error while creating product',
      }
    }
  }


  async getProductsByShop(shopId: string): Promise<ServiceResponse> {
    try {
      const products = await prisma.product.findMany({
        where: {
          shopId: shopId,
          isDeleted: false, // Never return deleted products to the customer
        },
        orderBy: {
          createdAt: 'desc', // Show newest products first
        },
      })

      return {
        status: 200,
        success: true,
        message: 'Products fetched successfully',
        data: products, // Returns an array of products []
      }
    } catch (error) {
      console.error('ProductService.getProductsByShop Error:', error)
      return {
        status: 500,
        success: false,
        message: 'Internal server error while fetching shop products',
      }
    }
  }

  async updateProduct(
    vendorId: string,
    productId: string,
    data: any,
  ): Promise<ServiceResponse> {
    try {
      // 1. Verify ownership
      const check = await this.verifyProductOwnership(vendorId, productId)
      if (check.error) {
        return { status: check.status, success: false, message: check.error }
      }

      // 2. Update the product
      const updatedProduct = await prisma.product.update({
        where: { id: productId },
        data: {
          title: data.title,
          imageUrl: data.imageUrl,
          price: data.price,
          isAvailable: data.isAvailable,
        },
      })

      return {
        status: 200,
        success: true,
        message: 'Product updated successfully',
        data: updatedProduct,
      }
    } catch (error) {
      console.error('ProductService.update Error:', error)
      return {
        status: 500,
        success: false,
        message: 'Internal server error while updating product',
      }
    }
  }

  async deleteProduct(
    vendorId: string,
    productId: string,
  ): Promise<ServiceResponse> {
    try {
      // 1. Verify ownership
      const check = await this.verifyProductOwnership(vendorId, productId)
      if (check.error) {
        return { status: check.status, success: false, message: check.error }
      }

      // 2. Soft delete the product so past orders don't break
      await prisma.product.update({
        where: { id: productId },
        data: { isDeleted: true, isAvailable: false },
      })

      return {
        status: 200,
        success: true,
        message: 'Product deleted successfully',
      }
    } catch (error) {
      console.error('ProductService.delete Error:', error)
      return {
        status: 500,
        success: false,
        message: 'Internal server error while deleting product',
      }
    }
  }
}
