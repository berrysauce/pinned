import { Hono } from "hono"
import { cache } from "hono/cache"
import { secureHeaders } from "hono/secure-headers"

import cheerio from "cheerio"

const app = new Hono()

// Add middleware
app.use("*", secureHeaders())
// add 5 minute cache to all requests
app.get(
    "*",
    cache({
        cacheName: "gh-request-cache",
        cacheControl: "max-age=300",
    })
)


app.get("/", async (c) => {
    return c.json({
        "detail": "Please use /get/username to get the pinned repositories of a user"
    })
})


app.get("/get/:username", async (c) => {
    const username = c.req.param("username")

    // get html of github profile
    const request = await fetch(`https://github.com/${username}`)
    const html = await request.text()

    // create cheerio object with html
    const $ = cheerio.load(html)

    let pinned_repos: string[] = []

    try {
        // loop through each pinned repository in the item list
        $(".js-pinned-item-list-item").each((i, el) => {
            console.log($(el).text())

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

            // run star and fork checks in try catch blocks to prevent errors (if they are not present in the html)

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

            pinned_repos.push(repo_data)
        });
    } catch(e) {
        c.status(500)
        return c.json({
            "detail": "Error parsing HTML"
        })
    }

    return c.json(pinned_repos)
})


export default app
