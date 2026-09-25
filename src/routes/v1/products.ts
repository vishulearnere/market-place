import express from 'express'
import { auth, requireRoles } from '../../middleware/auth.js'
import * as productControllers from '../../controllers/product_controllers.js'

// have to add auth here

const router = express.Router()


router.post('/create',auth,requireRoles(['VENDOR']), productControllers.createProduct)
router.get('/:shopID',auth,requireRoles(['CUSTOMER']), productControllers.getProductsByShopID)
router.patch('/:productID',auth,requireRoles(['VENDOR']), productControllers.updateProduct)
router.delete('/:productID',auth,requireRoles(['VENDOR']), productControllers.deleteProduct)



export default router
