import * as express from 'express';
import * as bodyParser from 'body-parser';

const CORS = (req, res, next) => {
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'X-Requested-With, Content-type, Accept, X-Token');
    res.header('Access-Control-Allow-Origin', '*');
    next();
}

let app = express();
app.use(CORS);
app.use(bodyParser.json({ limit: '50mb'}));
app.use(bodyParser.urlencoded({ limit: '50mb' , extended: false }));