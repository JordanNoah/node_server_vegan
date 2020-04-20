const jwt = require('jsonwebtoken');
const config = require('../config/app_config.js');

verifyToken = (req, res, next) => {
    console.log("verifing token");
    
    let token = req.headers['x-access-token'];

    if (!token) {
        return res.send({
            status: 'fail', message: 'No token provided.'
        });
    }

    jwt.verify(token, config.secret, (err, decoded) => {
        if (err) {
            return res.send({
                status: 'fail',
                message: 'Fail to Authentication. Error -> ' + err
            });
        }
        req.idUser = decoded.idUser;
        next();
    });
}
const authJwt = {};

authJwt.verifyToken = verifyToken;

module.exports = authJwt;