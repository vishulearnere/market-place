import express from 'express'
import {auth,requireRoles} from '../../middleware/auth.js'
import * as userController from '../../controllers/user_controllers.js'

const router = express.Router()

router.post('/register', userController.signup)
router.post('/login', userController.loginUser)

router.get('/', auth, requireRoles(['ADMIN']), userController.getAllVendors)
router.patch('/status/:vendorID', auth,requireRoles(['ADMIN']), userController.updateVendor) 
router.patch('/disable/:vendorID', auth, requireRoles(['ADMIN']), userController.disableVendor)

export default router

