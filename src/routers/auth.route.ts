import express from 'express';
import { signIn, signUp } from '../controller/auth.controller';
import { auth } from '../middleware/auth.middleware'
import { catchAsync } from '../utils/catchAsync';

const router = express.Router();

router.post('/register', catchAsync(signUp));
router.post('/login', catchAsync(signIn));
router.get('/test', auth, (req, res) => {
    return res.status(200).json({ message: 'Test route accessed', user: (req as any).user });
})

export default router;