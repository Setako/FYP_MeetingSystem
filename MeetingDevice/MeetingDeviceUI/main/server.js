let express = require('express');
let bodyParser = require('body-parser');
let app = express();
let http = require('http');
let exec = require('child_process').exec;
const controlRouter = require('./api-controller/control-api/control-router');

module.exports = function() {
    app.use(bodyParser.json());
    app.use('/control', controlRouter);

    function listen(port) {
        http.createServer(app).listen(port);
        console.log('listening on ' + port);
        // app.listen(port);
    }
    return {
        listen: listen,
    };
};
