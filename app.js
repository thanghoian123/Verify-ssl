var express=require('express');
var app=express();
const bodyParser = require("body-parser");

var routes=require('./routes/route.js');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.set('view engine','ejs');

app.use(express.static(__dirname + '/public'));

app.get('/',routes.home);

var port = process.env.PORT || 3000;




var exec = require('child_process').exec;

function runCommands(array, callback) {
    var index = 0;
    var results = [];

    function next() {
       if (index < array.length) {
           exec(array[index++], function(err, stdout) {
               if (err) return callback(err);
               // do the next iteration
               results.push(stdout);
               next();
           });
       } else {
           // all done here
           callback(null, results);
       }
    }
    // start the first iteration
    next();
}



var server=app.listen(port,function(req,res){
    console.log("Catch the action at http://localhost:"+port);
});

var fs = require("fs")

app.post("/",(req, res)=>{
    // console.log(req.body)
    const {domain} = req.body;
    const commands = ["echo 'test'"];
    runCommands(commands, function(err, results) {
        // error or results here
        if(err){
            // handle err
            console.log(err,"===err");
        }else{
            // pass step 1
            fs.readFile('conf', function (err, data) {
                if (err) {
                    return console.error(err);
                }
                const confData = data.toString().replace("@server_name", domain);
                fs.writeFile(`nginx.conf.file/${domain}`, confData,  function(err) {
                    if (err) {
                        return console.error(err);
                    }
                    runCommands([`ln -s nginx.conf.file/${domain} /etc/nginx/sites-available/${domain}`,"nginx -t","nginx -s reload"])
                 });
             });
        }
    });
})