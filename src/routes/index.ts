import { Router } from "express";
import urlRoutes from "./v1/url.routes";
import redirectRoutes from "./redirect.routes";

const router = Router();

router.use("/v1", urlRoutes);
router.use("/", redirectRoutes);

export default router;
