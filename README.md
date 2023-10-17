# 📌 Pinned

Pinned is an API that returns pinned repositories for the requested username from GitHub.

```http
GET  https://pinned.berrysauce.me/get/username
```

Replace `username` with your GitHub username. Pinned will return the JSON in the following format:

```json
[
    { 
        "author": "berrysauce",
        "name": "junk.boats",
        "description": "♻️ The free temporary email service powered by Cloudflare",
        "language": "CSS",
        "stars": 53,
        "forks": 0 
    },
    { 
        "author": "berrysauce",
        "name": "ingredients",
        "description": "🧪 Determine the \"ingredients\" (or technologies) behind a website",
        "language": "Svelte",
        "stars": 58,
        "forks": 0 
    },
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

If Pinned runs into an error, the response will have a `500` HTTP status code and the following response text:

```json
{
    "detail": "Error parsing HTML",
    "error": ...
}
```

## Development

Clone the repository, `cd` into it and run the following commands to install dependencies and run the code:

```
npm install
npm run dev
```

Pinned is deployed on [Cloudflare Workers](https://workers.cloudflare.com/). To deploy Pinned, run the following command:

```
npm run deploy
```
