import { Router } from "express";
import { courseTracks, marketingPages, productCards } from "../lib/api-content.js";
import { databaseEnabled } from "../config.js";
import { prisma } from "../lib/prisma.js";

export const catalogRouter = Router();

catalogRouter.get("/products", (_req, res) => {
  return res.json(productCards);
});

catalogRouter.get("/pages", (_req, res) => {
  return res.json(marketingPages);
});

catalogRouter.get("/courses", async (_req, res) => {
  if (!databaseEnabled) {
    return res.json(
      courseTracks.map((track, index) => ({
        id: `course-demo-${index + 1}`,
        slug: track.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
        title: track.title,
        description: track.focus,
        category: "PROGRAM",
        targetLevel: track.targetLevel,
        estimatedDays: Number.parseInt(track.pace, 10) || null,
      })),
    );
  }

  const courses = await prisma.course.findMany({
    orderBy: { title: "asc" },
  });

  return res.json(courses);
});
