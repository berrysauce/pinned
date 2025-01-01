import { Hono } from "hono";
import { cors } from "hono/cors";
import { cache } from "hono/cache";
import { prettyJSON } from "hono/pretty-json";
import { secureHeaders } from "hono/secure-headers";

import { parse, HTMLElement } from "node-html-parser";

type Bindings = {
  dev?: boolean;
};

const app = new Hono<{ Bindings: Bindings }>();

// Configure middleware for JSON formatting, security headers and CORS
app.use("*", prettyJSON({ space: 4 }));
app.use("*", secureHeaders());
app.use(
  "*",
  cors({
    origin: "*",
    allowMethods: ["GET"],
  })
);

// Enable 5 minute caching for all routes in production
app.use("*", async (c, next) => {
  if (!c.env.dev) {
    return cache({
      cacheName: "gh-request-cache",
      cacheControl: "max-age=300",
    })(c, next);
  }
  return next();
});

// Redirect root path to GitHub repository
app.get("/", async (c) => {
  return c.redirect("https://github.com/berrysauce/pinned", 301);
  // return c.text("📌 PINNED\nPlease use /get/username to get the pinned repositories of a GitHub user")
});

// Define structure for repository data
interface RepositoryData {
  author: string;
  name: string;
  description: string;
  language: string;
  stars?: number;
  forks?: number;
}

function parseRepository(root: HTMLElement, el: HTMLElement): RepositoryData {
  const repoPath =
    el.querySelector("a")?.getAttribute("href")?.split("/") || [];
  const [, author = "", name = ""] = repoPath;

  const parseMetric = (index: number): number => {
    try {
      return (
        Number(
          el
            .querySelectorAll("a.pinned-item-meta")
            [index]?.text?.replace(/\n/g, "")
            .trim()
        ) || 0
      );
    } catch {
      return 0;
    }
  };

  return {
    author,
    name,
    description:
      el.querySelector("p.pinned-item-desc")?.text?.replace(/\n/g, "").trim() ||
      "",
    language:
      el.querySelector("span[itemprop='programmingLanguage']")?.text || "",
    stars: parseMetric(0),
    forks: parseMetric(1),
  };
}

// Fetch and parse pinned repositories for a given GitHub username
app.get("/get/:username", async (c) => {
  const username = c.req.param("username");

  // Fetch the GitHub profile HTML
  let request: Response;
  try {
    request = await fetch(`https://github.com/${username}`);
  } catch {
    c.status(500);
    return c.json({
      detail: "Error fetching user",
    });
  }

  // Handle common HTTP error responses
  const errorResponses: Record<number, { status: number; message: string }> = {
    404: { status: 404, message: "User not found" },
    429: { status: 429, message: "Origin rate limit exceeded" },
  };

  const errorResponse = errorResponses[request.status];
  if (errorResponse) {
    c.status(errorResponse.status);
    return c.json({ detail: errorResponse.message });
  }

  if (request.status !== 200) {
    c.status(500);
    return c.json({ detail: "Error fetching user" });
  }

  const html = await request.text();
  const root = parse(html);

  try {
    const pinned_repos = root
      .querySelectorAll(".js-pinned-item-list-item")
      .map((el) => parseRepository(root, el));

    return c.json(pinned_repos);
  } catch {
    c.status(500);
    return c.json({
      detail: "Error parsing user",
    });
  }
});

export default app;
