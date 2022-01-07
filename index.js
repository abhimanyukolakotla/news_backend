const express = require('express');
const morgan = require("morgan");
const nocache = require("nocache");
const { createProxyMiddleware } = require('http-proxy-middleware');
const httpApi = require('request');
const cors = require('cors');
const getFavicons = require('get-website-favicon');
const scrapFavicon = require('scrap-favicon');
// Create Express Server
const app = express();
app.use(cors())
app.use(nocache());
// Configuration
const PORT = 3000;
const HOST = "0.0.0.0";
const API_SERVICE_URL = "https://hacker-news.firebaseio.com/v0";

// Logging
app.use(morgan('dev'));

// Proxy endpoints
app.use('/api', createProxyMiddleware({
    target: API_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: {
        [`^/api`]: '',
    },
}));

app.get('/getFavicon', async (req, res) => {
    var data = await getFavicons(req.query.url);
    console.log(JSON.stringify(data));
    if (data.icons == null || data.icons[0] == null || data.icons[0].src == null) {

        res.send("Error");
        return;
    }
    var faviconUrl = data.icons[0].src;
    httpApi({
        url: faviconUrl, encoding: null
    }, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            res.contentType('image/png');
            res.send(response.body);
            res.end();
        } else {
            res.send("Error");
        }
    });
});

app.get('/scrapeFavicon', async (req, res) => {
    var data = JSON.parse(JSON.stringify(await scrapFavicon(req.query.url)));
    //console.log(JSON.stringify(data, null, 4));
    //console.log(`IS SUCCESS: ${typeof data}`);
    if (data.images.length == 0) {
        res.status(404).send("Error");
        return;
    }
    var faviconUrl = data.images[0].url;
    //console.log(`URL: ${faviconUrl}`);
    fetchFavicon(res, data);
});

function fetchFavicon(res, data, index = 0) {
    //console.log(`RUNNING on ${data['images'][index].url}`)
    httpApi({
        url: data['images'][index].url, encoding: null
    }, function (error, response, body) {
        //console.log(`ERROR: ${error}`);
        //console.log(`response.statusCode: ${response.statusCode}`);
        if (!error && response.statusCode == 200) {
            res.contentType('image/png');
            res.send(response.body);
            res.end();
        } else {
            // 
            if (index == data['images'].length - 1) {
                res.send("Error");
                return;
            } else {
                index++;
                fetchFavicon(res, data, index);
            }
        }
    });
}
// Start the Proxy
app.listen(PORT, HOST, () => {
    console.log(`Starting Proxy at ${HOST}:${PORT}`);
});


