import { Router } from "express";
import userRoutes from "./users/user.routes";
const router = Router();

router.use("/users", userRoutes);


export default router;