import { Hono } from "hono"
import { cors } from "hono/cors"
import { cache } from "hono/cache"
import { prettyJSON } from "hono/pretty-json"
import { secureHeaders } from "hono/secure-headers"

import * as cheerio from "cheerio"

const app = new Hono()

// add middleware
app.use("*", prettyJSON({ space: 4 }))
app.use("*", secureHeaders())
app.use(
    "*",
    cors({
        origin: "*",
        allowMethods: ["GET"]
    })
)

// add 5 minute cache to all requests
app.get(
    "*",
    cache({
        cacheName: "gh-request-cache",
        cacheControl: "max-age=300",
    })
)


app.get("/", async (c) => {
    return c.text("📌 PINNED\nPlease use /get/username to get the pinned repositories of a GitHub user")
})


app.get("/get/:username", async (c) => {
    const username = c.req.param("username")

    // get HTML of GitHub profile
    let request: Response
    try {
        request = await fetch(`https://github.com/${username}`)
    } catch {
        c.status(500)
        return c.json({
            "detail": "Error fetching user"
        })
    }

    // added some HTTP error handling
    if (request.status == 404) {
        c.status(404)
        return c.json({
            "detail": "User not found"
        })
    } else if (request.status == 429) {
        c.status(429)
        return c.json({
            "detail": "Origin rate limit exceeded"
        })
    } else if (request.status != 200) {
        c.status(500)
        return c.json({
            "detail": "Error fetching user"
        })
    }

    const html = await request.text()

    // create cheerio object with HTML
    const $ = cheerio.load(html)

    let pinned_repos: string[] = []

    try {
        // loop through each pinned repository in the item list
        $(".js-pinned-item-list-item").each((i, el) => {
            // create interface for variable type and make stars and forks optional
            interface RepositoryData {
                author: string,
                name: string,
                description: string,
                language: string,
                stars?: number,
                forks?: number
            }

            /* 
            .replace(/\n/g, "") removes all newline characters
            .trim() removes all leading and trailing whitespaces
            */
            let repo_data: RepositoryData = {
                "author": $(el).find("a").get(0).attribs.href.split("/")[1], 
                "name": $(el).find("a").get(0).attribs.href.split("/")[2],
                "description": $(el).find("p.pinned-item-desc").text().replace(/\n/g, "").trim(),
                "language": $(el).find("span[itemprop='programmingLanguage']").text()
            }

            // run star and fork checks in try catch blocks to prevent errors (if they are not present in HTML)

            try {
                repo_data["stars"] = Number($(el).find("a.pinned-item-meta:first").text().replace(/\n/g, "").trim())
            } catch {
                repo_data["stars"] = 0
            }

            try {
                repo_data["forks"] = Number($(el).find("a.pinned-item-meta:second").text().replace(/\n/g, "").trim())
            } catch {
                repo_data["forks"] = 0
            }

            // add repository data to pinned_repos arrays
            pinned_repos.push(repo_data)
        });
    } catch {
        c.status(500)
        return c.json({
            "detail": "Error parsing user"
        })
    }

    return c.json(pinned_repos)
})


export default app
