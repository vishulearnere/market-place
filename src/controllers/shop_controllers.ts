import { Request, Response, NextFunction } from 'express'
import Joi from 'joi'
import { ShopService } from '../services/shops.js'


const locationSchema = Joi.object({
  latitude: Joi.number().min(-90).max(90).required(),
  longitude: Joi.number().min(-180).max(180).required(),
})

export const updateShopLocation = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const  shopID = req.params.shopID as string

    // 1. Validate coordinates
    console.log('Request body for location update:', req.body) // Debugging line
    const { error, value } = locationSchema.validate(req.body)
    if (error) {
      return res
        .status(400)
        .json({ success: false, message: error.details[0].message })
    }

    const shopSvc = new ShopService()
    console.log(req.user) // Debugging line to check if req.user is populated
    // 2. Pass vendorId from token to ensure they can't change someone else's shop
    const result = await shopSvc.updateLocation(
      req.user!.userId,
      shopID,
      value.latitude,
      value.longitude,
    )

    return res.status(result.status).json({ ...result })
  } catch (error) {
    next(error)
  }
}

export const shopsByGeoLocation = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { lat,lng,radius } = req.query
    console.log('Received geolocation:', lat,lng) // Debugging line

    // Parse the URL parameter: expected format "latitude,longitude"
    // const [latString, lngString] = geoLocation.split(',').map((s) => s.trim())
    const latitude = parseFloat(lat as string)
    const longitude = parseFloat(lng as string)
    const searchRadius = radius ? parseFloat(radius as string) : 20

    if (isNaN(latitude) || isNaN(longitude)) {
      return res.status(400).json({
        success: false,
        message:
          'Invalid geolocation format. Expected format: latitude,longitude (e.g., 26.233,78.333)',
      })
    }

    const shopSvc = new ShopService()
    const result = await shopSvc.getNearbyShops(latitude, longitude, searchRadius)

    return res.status(result.status).json({ ...result })
  } catch (error) {
    next(error)
  }
}
