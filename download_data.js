let Fs = require('fs');
let Config = require('config');
require('isomorphic-fetch');


// let api_key = 'b4abaffe39ce440d84f9c568b94f5589';
// let location = 'Rostov-on-Don,ru';
let api_key = Config.get("api_key");
let location = Config.get("location");


let url = `https://api.openweathermap.org/data/2.5/forecast?q=${location}&APPID=${api_key}&units=metric`;

function process_data(data){
    function get_day(record){
        let date = new Date(record.dt * 1000);
        let day = date.getDay();
        return day;
    }
    let res = [];
    let n = 0;
    let list = data.list;
    let cur_day = (new Date()).getDay();
    let cur_temp_sum = 0;
    let cur_temp_num = 0;
    let weather_codes = {};
    while(n < list.length){
        let day = get_day(list[n]);
        if(day != cur_day){
            cur_day = day;
            break;
        }
        ++n;
    }
    for(let i = 0; i < 3; ++i){
        while(n < list.length){
            let day = get_day(list[n]);
            if(day != cur_day){
                let weather_count = 0;
                let weather_info;
                for(let id in weather_codes){
                    if(weather_codes[id].count >= weather_count){
                        weather_count = weather_codes[id].count;
                        weather_info = weather_codes[id].info;
                    }
                }
                res.push({
                    temp: cur_temp_sum / cur_temp_num,
                    info: weather_info
                });
                cur_day = day;
                cur_temp_num = 0;
                cur_temp_sum = 0;
                weather_codes = {};
                break;
            }
            cur_temp_sum += list[n].main.temp;
            ++cur_temp_num;
            for(let weather of list[n].weather){
                if(weather.id in weather_codes){
                    ++weather_codes[weather.id].count;
                }else{
                    weather_codes[weather.id] = {
                        count: 1,
                        info: {
                            weather: weather,
                            dt: list[n].dt
                        }
                    }
                }
            }
            ++n;
        }
    }
    return res;
}

function get_data(){
    return fetch(url)
    .then((res)=>{
        return res.json();
    }).then((data)=>{
        return process_data(data);
    });
}
exports.get_data = get_data;

function download_icons(){
    let base_url = 'https://openweathermap.org/img/wn/'
    let base_fn = './public/icons/'
    if(!Fs.existsSync(base_fn)){
        Fs.mkdirSync(base_fn, {recursive: true});
    }
    let icons = [
        '01d', '01n',
        '02d', '02n',
        '03d', '03n',
        '04d', '04n',
        '09d', '09n',
        '10d', '10n',
        '11d', '11n',
        '13d', '13n'
    ];
    let suffixes = ['.png', '@2x.png']
    for(let icon of icons){
        for(let suffix of suffixes){
            let fn = base_fn + icon + suffix;
            let url = base_url + icon + suffix;
            Fs.exists(fn, (res)=>{
                if(!res){
                    console.log('loading icon ', icon);
                    fetch(url)
                    .then((res)=>{
                        let stream = Fs.createWriteStream(fn);
                        res.body.pipe(stream);
                    })
                }
            });
        }
    }
}
exports.download_icons = download_icons;
