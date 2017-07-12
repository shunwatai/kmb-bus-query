var port = process.argv[2]
var path = require('path')
var fs = require('fs')
var express = require('express')
var app = express()
var bodyparser = require('body-parser')
var http = require('http')
app.use(bodyparser.urlencoded({extended: false})) // for parse the incoming POST req data

// load form.html (html static files) in public/
app.use(express.static(process.argv[3] || path.join(__dirname, 'public')))

// count for the callback request in order. Here is counting bus bound1 & bound2
var completed_requests = 0
// for storing the bus bound info
var parsedJSON = []

app.get('/busno', function(req,res){ // receive the bus number from user input
    console.log(req.query.number)
    // 2 bound(direction) URL of the given bus number
    var bound1url = "http://search.kmb.hk/KMBWebSite/Function/FunctionRequest.ashx?action=getstops&route=" + req.query.number + "&bound=1&serviceType=1"
    var bound2url = "http://search.kmb.hk/KMBWebSite/Function/FunctionRequest.ashx?action=getstops&route=" + req.query.number + "&bound=2&serviceType=1"

    // store URL into array
    var urls = [bound1url,bound2url]

    // loop through 2 bound urls
    for (var i=0; i<urls.length; i++){
        count_cb(i,urls,res) // pass the urls to count_cb for counting urls, i is the index of urls. At the end, count_cb will send the response data to user browser
    }
})

app.post('/token', function(req,res){ // receive the tk(token) from user
    //console.log(req.body)
    console.log("========================")
    // URL for post the processed Token to KMB for getting back the "time info" response
    var url = 'http://search.kmb.hk/KMBWebSite/Function/FunctionRequest.ashx/?action=get_ETA&lang=1'

    // START of making token
    var d = new Date();
    var sep_time = d.getFullYear() + '-' + ('00' + (d.getUTCMonth() + 1)).slice(-2) + '-' + ('00' + d.getUTCDate()).slice(-2) + ' ' + ('00' + d.getUTCHours()).slice(-2) + ':' + ('00' + d.getUTCMinutes()).slice(-2) + ':' + ('00' + d.getUTCSeconds()).slice(-2) + '.' + ('00' + d.getUTCMilliseconds()).slice(-2) + '.'

    var sep = '--31' + sep_time + '13--';
    // 'EA' + base64 encode of (bus number + bound + serviceType + bsiCode + stopSeq)/w sep
    var token = 'EA' + new Buffer(req.body.busNo.trim() + sep + req.body.bound + sep + req.body.serviceType  + sep + req.body.bsiCode.trim().replace(/-/gi, '') + sep + req.body.stopSeq + sep + new Date().getTime()).toString('base64')
    // END of making token

    // make POST request to KMB with the Token + sep_time as form
    var request = require('request');
    request.post({url, form: { token:token,t:sep_time } },
        function (error, response, body) {
            if (!error && response.statusCode == 200) {
                // Finally get back the time info response
                //console.log(body)
                var result = JSON.parse(body)

                // get the length of res. data, it is the number of the time info of the coming bus
                var resLen = result.data.response.length
                var results = ""

                // this loop for calculate the time duration(difference) between the "current time" and "respond next bus time"
                for (var i=0; i<resLen; i++){
                    var nx_bus_info = result.data.response[i].t.split('　') // take out the next bus time

                    console.log(nx_bus_info)

                    //console.log(!isNaN(parseInt(nx_bus_info[0])))
                    if (!isNaN(parseInt(nx_bus_info[0]))){ // if the time is time, not string or other shit
                        var curr_time = d.getTime() // get current time in unix epoch

                        var yyyy = d.getUTCFullYear()
                        var mm = d.getUTCMonth()+1
                        var dd = d.getUTCDate()
                        var hh = parseInt(nx_bus_info[0].split(':')[0])
                        var min = nx_bus_info[0].split(':')[1]
                        var bus_time = new Date(yyyy+" "+mm+" "+dd+" "+hh+":"+min+":"+"00").getTime() //  get next bus time in unix epoch
                        //console.log(curr_time) // unix epoch time
                        //console.log(bus_time)  // unix epoch time
                        var min_til_nx_bus = Math.floor((bus_time - curr_time)/(1000 * 60)) // take the difference and then convert unix epoch time back to MM:SS
                        //$('<p>班次 #'+ i + ' ' +min_til_nx_bus+' minutes</p>').appendTo('#show_info')
                        results = results + '班次#'+ i + ' ' +min_til_nx_bus+' minutes left ('+ nx_bus_info[0] +')<br>' // store the time info to "results"
                    }
                    else{
                        console.log('no time info provide...')
                        results = results + nx_bus_info[0] + '<br>'
                    }
                }
                res.send(results) // after looped all next bus info, send the "results" as response to the user browser
            }
        }
    )
})

function count_cb(num,urls,res){
    http.get(urls[num], (get_res) => {
        get_res.setEncoding('utf8');
        let rawData = '';
        get_res.on('data', (chunk) => { rawData += chunk; });
        get_res.on('end', () => {
            try {
                const parsedData = JSON.parse(rawData);
                //console.log(parsedData);
                parsedJSON[num] = parsedData;
                completed_requests = completed_requests + 1
                if (completed_requests == urls.length){ // if got the last bound info, return the response to user browser
                    res.send(parsedJSON)
                    // reset the array and counter for next request
                    parsedJSON = []
                    completed_requests = 0
                }
            } catch (e) {
                console.error(e.message);
            }
        })
    })
}

app.listen(port)
