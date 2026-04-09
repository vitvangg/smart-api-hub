import express from 'express';
import { createResource, getAllResources, getResourceById, deleteResource, updateResource } from '../controller/resource.controller';
import { catchAsync } from '../utils/catchAsync';
import { validateResourceAndId } from '../middleware/validate';
const router = express.Router();

router.get('/:resource', validateResourceAndId, catchAsync(getAllResources));
router.get('/:resource/:id', validateResourceAndId, catchAsync(getResourceById));
router.post('/:resource', validateResourceAndId, catchAsync(createResource));
router.delete('/:resource/:id', validateResourceAndId, catchAsync(deleteResource));
router.patch('/:resource/:id', validateResourceAndId, catchAsync(updateResource));
router.put('/:resource/:id', validateResourceAndId, catchAsync(updateResource));
export default router;