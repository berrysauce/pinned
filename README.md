# 📌 Pinned

![Uptime](https://uptime.berrysauce.dev/api/badge/8/uptime)

Pinned is an API that returns pinned repositories for the requested username from GitHub. This is ideal for creating a "Pinned Repositories" section on your website.

```http
GET  https://pinned.berrysauce.dev/get/username
```

Replace `username` with your GitHub username. Pinned will return the JSON in the following format:

```json
[
    { 
        "author": "berrysauce",
        "name": "whatdevsneed",
        "description": "🧰 Discover new developer tools",
        "language": "HTML",
        "stars": 58,
        "forks": 0
    },
    ...
]
```

You can add `?pretty` at the end of your request to get a formatted response.

If Pinned runs into an error, it will return a response with a response code other than `200` and the following format:

```json
{
    "detail": "Error parsing HTML"
}
```

> [!NOTE]  
> This API has a 5 minute cache in place to reduce requests to the origin. With this said, it might take a moment for your pinned repositories to update.

## Development

Clone the repository, `cd` into it and run the following commands to install dependencies and run the code:

```bash
bun install
bun run dev
```

Pinned is deployed on [Cloudflare Workers](https://workers.cloudflare.com/). To deploy Pinned, run the following command:

```bash
bun run deploy
```
