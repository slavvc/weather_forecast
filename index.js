let Fs = require('fs');
let Express = require('express');
let Vue = require('vue');
let VueRenderer = require('vue-server-renderer');
let get_data = require('./download_data');
let Config = require('config');

let renderer = VueRenderer.createRenderer({
    template: Fs.readFileSync('./templates/index.html', 'utf-8')
});

get_data.download_icons();

let server = Express();

server.use(Express.static('public'));
server.use(Express.static('node_modules/bootstrap/dist'));
server.get('/favicon.ico', (req,res)=>{
    let icon = './public/icons/02d.png';
    Fs.exists(icon, (exists)=>{
        if(exists){
            res.contentType('png');
            let stream = Fs.createReadStream(icon);
            stream.pipe(res);
        }else{
            res.sendStatus(404);
        }
    });
});
server.get('/', (req, res)=>{
    get_data.get_data()
    .then((weather)=>{
        let date = new Date(weather.date);
        let app = new Vue({
            data:{
                temp_data: weather.data,
                updated: date.toDateString() +  ' ' + date.toTimeString().split(' ')[0]
            },
            template: Fs.readFileSync('./templates/weather.html', 'utf-8')
        });
        res.contentType("html");
        renderer.renderToStream(app).pipe(res);
    }).catch((err)=>{
        res.status(500);
        res.send("Can't get weather info");
    });
    
});

server.listen(Config.get("port"));