import express from "express";
import { deleteUser, updateUser } from "../controller/user.controller";
import { auth } from "../middleware/auth.middleware";
import { catchAsync } from "../utils/catchAsync";

const router = express.Router();

router.patch('/:id', auth, catchAsync(updateUser));
router.put('/:id', auth, catchAsync(updateUser));
router.delete('/:id', auth, catchAsync(deleteUser));

export default router;