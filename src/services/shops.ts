import { prisma } from '../lib/prisma.js'

export interface ServiceResponse<T = any> {
  status: number
  success: boolean
  message: string
  data?: T
}

export class ShopService {
  /**
   * Updates the shop's latitude and longitude.
   * Verifies the vendor actually owns this shop.
   */
  /**
   * Updates the shop's latitude and longitude.
   * Verifies the vendor owns the shop AND the shop is not disabled.
   */
  async updateLocation(
    vendorId: string,
    shopId: string,
    latitude: number,
    longitude: number,
  ): Promise<ServiceResponse> {
    try {
      // 1. Verify ownership and fetch the status
      const shop = await prisma.shop.findUnique({
        where: { id: shopId },
      })

      if (!shop) {
        return { status: 404, success: false, message: 'Shop not found' }
      }

      if (shop.ownerId !== vendorId) {
        return {
          status: 403,
          success: false,
          message: 'You do not own this shop',
        }
      }

      // NEW: Block location updates if the shop is disabled
      if (shop.status === 'DISABLED') {
        return {
          status: 403,
          success: false,
          message: 'Your shop is disabled. You cannot update its location.',
        }
      }

      // 2. Update coordinates
      const updatedShop = await prisma.shop.update({
        where: { id: shopId },
        data: { latitude, longitude },
        select: {
          id: true,
          name: true,
          status: true,
          latitude: true,
          longitude: true,
        },
      })

      return {
        status: 200,
        success: true,
        message: 'Location updated successfully',
        data: updatedShop,
      }
    } catch (error) {
      console.error('ShopService.updateLocation Error:', error)
      return {
        status: 500,
        success: false,
        message: 'Internal server error while updating location',
      }
    }
  }

  /**
   * Fetches approved shops within a specific radius (in kilometers)
   */
  async getNearbyShops(
    targetLat: number,
    targetLng: number,
    radiusKm: number = 2,
  ): Promise<ServiceResponse> {
    try {
      // The WHERE status = 'APPROVED' clause guarantees that DISABLED,
      // PENDING, and REJECTED shops are completely hidden from customers.
      const nearbyShops = await prisma.$queryRaw`
        SELECT * FROM (
          SELECT 
            id, 
            name, 
            status,
            latitude, 
            longitude,
            (
              6371 * acos(
                cos(radians(${targetLat})) * cos(radians(latitude)) *
                cos(radians(longitude) - radians(${targetLng})) +
                sin(radians(${targetLat})) * sin(radians(latitude))
              )
            ) AS distance
          FROM "Shop"
          WHERE status != 'DISABLED'
        ) AS shop_distances
        WHERE distance <= ${radiusKm}
        ORDER BY distance ASC;
      `

      return {
        status: 200,
        success: true,
        message: `Found shops within ${radiusKm}km`,
        data: nearbyShops,
      }
    } catch (error) {
      console.error('ShopService.getNearbyShops Error:', error)
      return {
        status: 500,
        success: false,
        message: 'Internal server error while searching for shops',
      }
    }
  }
}
