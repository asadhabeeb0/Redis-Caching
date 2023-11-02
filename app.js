const express = require('express');
const fetch = require('isomorphic-fetch');
const redis = require('ioredis');

const client = redis.createClient();

client.on('connect', () => {
  console.log('Redis Server connected');
});

client.on('error', (err) => {
  console.error(`Redis Error: ${err}`);
});

const PORT = process.env.PORT || 5000;
const REDIS_PORT = process.env.REDIS_PORT || 6379;

const app = express();

function setResponse(username,repos){
    return `<h2>${username} has ${repos} Github repos</h2>`;
}

async function getRepos(req, res, next) {
    try {
        console.log('Fetching Data...');
        const { username } = req.params;
        const response = await fetch(`https://api.github.com/users/${username}`);
        const data = await response.json();
        const repos= data.public_repos;
        client.setex(username, 99000, repos);
        res.send(setResponse(username, repos));
    } catch (err) {
        console.log(err);
        res.status(500);
    }
}

function cache(req, res, next) {
    const {username}= req.params;
    client.get(username, (err,data)=> {
        if(err) throw err;

        if(data !== null){
            res.send(setResponse(username, data));
        } else {
            next();
        }
    })
}

app.get('/repos/:username', cache, getRepos);

app.listen(PORT, () => {
    console.log(`App listening on port ${PORT}`);
});