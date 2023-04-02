const pg = require('pg');

const pool = new pg.Pool({
    user: 'postgres',
    password: 'test',
    database: 'workedtimes',
    host: 'localhost',
    port: 54321,
});

const uniqRow = async (query, ...arr) => {
    try {
        const client = await pool.connect();
        const data = await client.query(query, arr);
        client.release();
        return data;
    } catch (error) {
        console.log(error, 'POSTGRESQL UNIQROW');
    }
};

module.exports = {
    uniqRow,
};
