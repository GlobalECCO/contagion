/*******************************************************************************
 * Instance of the server logging functionality
 ******************************************************************************/
var winston = require('winston');


var log = new (winston.Logger)({
  transports: [new winston.transports.Console({ level: 'verbose' }),
               new winston.transports.File({filename:'log/game.log', json:false, level:'verbose'})]
});


exports.log = log;
