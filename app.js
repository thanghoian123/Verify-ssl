var express = require('express');
var app = express();
const bodyParser = require("body-parser");

var routes = require('./routes/route.js');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.set('json spaces', 40);
app.set('view engine', 'ejs');

app.use(express.static(__dirname + '/public'));

app.get('/', routes.home);

var port = process.env.PORT || 3000;

var execSync = require("child_process").execSync;

var server = app.listen(port, function (req, res) {
    console.log("Catch the action at http://localhost:" + port);
});

var fs = require("fs");

function runCommand(command) {
    console.log(`exec ${command}`);
    try {
        let res = execSync(command);
        console.log("INFO");
        console.log(res.toString());
    } catch (err) {
        console.log("ERROR");
        console.log("output",err);
        throw err.stderr.toString();
    }
}

function response(res, err, msg) {
    if (err) {
        res.status(500);
    }
    return res.json({
        error: err,
        message: msg
    });
}

app.post("/", (req, res) => {
    const { domain } = req.body;
    try {
        // Generate key pem
        runCommand(`sudo certbot --nginx certonly -d ${domain} -d www.${domain} -q`);
        const data = fs.readFileSync('templates/nginx_template.txt');
        let confData = data.toString().replace(/@DOMAIN/g, domain);
        confData = confData.toString().replace(/@WDOMAIN/g, `www.${domain}`);
        fs.writeFileSync(`templates/${domain}`, confData);
        runCommand(`sudo cp ${__dirname}/templates/${domain} /etc/nginx/sites-enabled`);
        runCommand(`sudo ln -sf /etc/nginx/sites-enabled/${domain} /etc/nginx/sites-available/${domain}`);
        runCommand("sudo nginx -t");
        runCommand("sudo nginx -s reload");
    } catch (err) {
        return response(res, true, err)
    }
    return response(res, false, "success")
})