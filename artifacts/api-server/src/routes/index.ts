import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import manualAuthRouter from "./manual-auth";
import videosRouter from "./videos";
import foldersRouter from "./folders";
import tagsRouter from "./tags";
import notesRouter from "./notes";
import aiRouter from "./ai";
import statsRouter from "./stats";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(manualAuthRouter);
router.use(videosRouter);
router.use(foldersRouter);
router.use(tagsRouter);
router.use(notesRouter);
router.use(aiRouter);
router.use(statsRouter);

export default router;
