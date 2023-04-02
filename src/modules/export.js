const { getTimeDifference, sumTimes, getDaysBetweenDates, dateRange, extractString } = require('../lib/usefulfunctions');
const { uniqRow } = require('../lib/pg');
const ExcelJS = require('exceljs');
const express = require('express').Router();
const moment = require('moment');

express.get('/export/:from/:to', async (req, res) => {
    const { from, to} = req.params
    
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Shodiyev Fayzulloh';
    workbook.lastModifiedBy = 'nodejs';
    workbook.created = new Date();
    workbook.modified = new Date();
    workbook.lastPrinted = new Date();
    
    const worksheet = workbook.addWorksheet('Oylik xisobot');
    new ExcelJS.stream.xlsx.WorkbookWriter({
        filename: 'demo_hidden_columns_bug.xlsx',
        useStyles: true,
    });
    
    let users = await uniqRow(`select * from users `);
    
    const columns = [
        { header: 'ID', key: 'id', width: 5 },
        { header: 'F.I.SH', key: 'name', width: 40 }
    ];
    for (let i = 1; i < getDaysBetweenDates(from, to) + 2; i++) {
        columns.push({
            header: 'kelish',
            key: `come${i}`,
        });
        columns.push({
            header: 'ketish',
            key: `leave${i}`,
        });
        columns.push({
            header: 'jami',
            key: `finishday${i}`,
            width: 12,
        });
    }
    columns.push({
        header: 'Oylik Vaqti',
        key: `finish`,
    });
    worksheet.columns = columns;
    
    let times = [];
    let rows = [];
    let counter = 1;
    for (const user of users.rows) {
        const obj = {};
        obj.id = counter;
        obj.name = user.user_fullname;
        
        let count = 1;
        const dates = dateRange(from, to);
        for (let date of dates) {
            const parts = date.split('-');
            datee = `${parts[2]}-${parts[1]}-${parts[0]}`;
            
            const queryCome = `
            select 
            *
            from workedtimes 
            where user_id = $1 and
            to_timestamp(regexp_replace(workedtime_time, '\\+(\\d{2})(\\d{2})$', ' $1:$2'), 'YYYY-MM-DD') = $2 and
            workedtime_action = 'checkIn'
            order by workedtime_time asc;
            `;
            const come = (await uniqRow(queryCome, user.user_id, datee)).rows[0];
            
            const queryLeave = `
            select 
            *
            from workedtimes 
            where user_id = $1 and
            to_timestamp(regexp_replace(workedtime_time, '\\+(\\d{2})(\\d{2})$', ' $1:$2'), 'YYYY-MM-DD') = $2 and
            workedtime_action = 'checkOut'
            order by workedtime_time desc;
            `;
            const leave = (await uniqRow(queryLeave, user.user_id, datee)).rows[0];
            
            if (come && !leave) {
                const queryFirstLeave = `
                select
                *
                from workedtimes
                where user_id = $1 and
                EXTRACT('Day' FROM workedtime_time::timestamp(0)) > $2 and
                workedtime_action = 'checkOut'
                order by workedtime_time asc`;
                const firstLeave = (await uniqRow(queryFirstLeave, user.user_id, come.workedtime_time.split('-')[2].split('T')[0])).rows[0];
                
                if (firstLeave) {
                    const queryThenFirstCome = `
                    select
                    *
                    from workedtimes
                    where user_id = $1 and
                    EXTRACT('Day' FROM workedtime_time::timestamp(0)) >= $2 and 
                    workedtime_action = 'checkIn'
                    order by workedtime_time asc`;
                    const thenFirstCome = (await uniqRow(queryThenFirstCome, user.user_id, come.workedtime_time.split('-')[2].split('T')[0])).rows[0];
                    const check = thenFirstCome ? thenFirstCome.workedtime_time.split('-')[2].split('T')[0] < firstLeave.workedtime_time.split('-')[2].split('T')[0] : false;
                    obj['come' + count] = come.workedtime_time.split('T')[1].split('+')[0];
                    obj['leave' + count] = !check ? firstLeave.workedtime_time.split('T')[1].split('+')[0] : '00:00:00';
                    obj['finishday' + count] = !check ? getTimeDifference(come.workedtime_time, firstLeave.workedtime_time ) : '00:00:00';
                    times.push(!check ? getTimeDifference(come.workedtime_time, firstLeave.workedtime_time) : '00:00:00');
                } else {
                    obj['come' + count] = come.workedtime_time.split('T')[1].split('+')[0];
                    obj['leave' + count] = '00:00:00';
                    obj['finishday' + count] = '00:00:00';
                }
                
            } else if (come && leave) {
                const moment1 = moment(come.workedtime_time);
                const moment2 = moment(leave.workedtime_time);
                
                const date1 = moment1.toDate();
                const date2 = moment2.toDate();
                
                obj['come' + count] = come.workedtime_time.split('T')[1].split('+')[0];
                obj['leave' + count] = leave && date1 < date2 ? leave.workedtime_time.split('T')[1].split('+')[0] : '';
                obj['finishday' + count] = date1 < date2 ? getTimeDifference(come.workedtime_time, leave.workedtime_time) : '00:00:00';
                
                times.push(date1 < date2 ? getTimeDifference(come.workedtime_time, leave.workedtime_time) : '00:00:00');
            }
            
            count += 1;
        }
        
        obj.finish = sumTimes(times);
        times = [];
        rows.push(obj);
        counter += 1;
    }
    
    worksheet.addRows(rows);
    
    
    await workbook.xlsx.writeFile('./xisobot.xls');
})

module.exports = express