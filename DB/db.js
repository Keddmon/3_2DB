// const fs = require("fs");
// const json = fs.readFileSync("./db/option.json","utf8");
// const options = JSON.parse(json);
// const mysql2 = require("mysql2/promise");
// const connection = mysql2.createConnection({
//     host: options.host,
//     port: options.port,
//     user: options.user,
//     password: options.password,
//     database: options.databse,
//     dateStrings: true,
// });

const fs = require("fs");
const json = fs.readFileSync("./db/option.json","utf8");
const options = JSON.parse(json);
const mysql = require('mysql2/promise')

const pool = mysql.createPool({
    host: 'localhost',
    user:'root',
    password:'keDDmon9091!',
    port : '3306',
    database:'coffeestore'
})


module.exports = pool;