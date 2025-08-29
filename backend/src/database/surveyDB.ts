import * as mysql from 'mysql2/promise'
export const surveyDB= mysql.createPool({
    host:'labs.ckzb0kiwakdk.us-east-1.rds.amazonaws.com',
    user:'admin',
    port:3306,
    password:'qcb_4HHXm]sfspgQ],Dn]w',
    database:'surveyClone',

    waitForConnections:true,
    connectionLimit:10
})
// labs.ckzb0kiwakdk.us-east-1.rds.amazonaws.com