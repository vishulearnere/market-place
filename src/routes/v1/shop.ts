import express from 'express'
import { auth, requireRoles } from '../../middleware/auth.js'
import * as shopController from '../../controllers/shop_controllers.js'

// have to add auth here

const router = express.Router()

router.patch('/:shopID',auth,requireRoles(['VENDOR']),shopController.updateShopLocation)
router.get('/',auth, requireRoles(['CUSTOMER']), shopController.shopsByGeoLocation)



export default router
