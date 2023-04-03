const { getTimeDifference, sumTimes, getDaysBetweenDates, dateRange, extractString, splitDate } = require('../lib/usefulfunctions');
const { uniqRow } = require('../lib/pg');
const ExcelJS = require('exceljs');
const express = require('express').Router();
const moment = require('moment');

express.get('/export/:from/:to', async (req, res) => {
    const { from, to} = req.params
    
    const workbook = new ExcelJS.Workbook({
        xlsx: undefined
    });
    
    workbook.creator = 'Shodiyev Fayzulloh';
    workbook.lastModifiedBy = 'nodejs';
    workbook.created = new Date();
    workbook.modified = new Date();
    workbook.lastPrinted = new Date();
    
    const worksheet = workbook.addWorksheet('Oylik xisobot');

    let users = await uniqRow(`select * from users`);
    
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
        obj.id = user.user_id;
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
            
            const dateObj = new Date(datee);
            dateObj.setDate(dateObj.getDate() + 1);
            const newDateStr = dateObj.toISOString().substring(0, 10);
            const queryNextCome = `
            select 
            *
            from workedtimes 
            where user_id = $1 and
            to_timestamp(regexp_replace(workedtime_time, '\\+(\\d{2})(\\d{2})$', ' $1:$2'), 'YYYY-MM-DD') = $2 and
            workedtime_action = 'checkIn'
            order by workedtime_time asc;`
            const nextCome = (await uniqRow(queryNextCome, user.user_id, newDateStr)).rows[0];
            
            let lastLeaveAfterCome
            if (nextCome) {
                const queryLastLeaveAfterCome = `
                select 
                *
                from workedtimes 
                where user_id = $1 and
                to_timestamp(regexp_replace(workedtime_time, '\\+(\\d{2})(\\d{2})$', ' $1:$2'), 'YYYY-MM-DD') = $2 and
                workedtime_time < $3 and
                workedtime_action = 'checkOut'
                order by workedtime_time asc;`
                lastLeaveAfterCome = (await uniqRow(queryLastLeaveAfterCome, user.user_id, newDateStr, nextCome.workedtime_time)).rows[0];
            }
            
            const queryNextLatestLeave = `
            select 
            *
            from workedtimes 
            where user_id = $1 and
            to_timestamp(regexp_replace(workedtime_time, '\\+(\\d{2})(\\d{2})$', ' $1:$2'), 'YYYY-MM-DD') = $2 and
            workedtime_action = 'checkOut'
            order by workedtime_time desc;`
            const nextLatestLeave = (await uniqRow(queryNextLatestLeave, user.user_id, newDateStr)).rows[0];

            
            if (come && leave) {
                
                const timeCome = splitDate(come.workedtime_time);
                const timeLeave = splitDate(leave.workedtime_time);
                const timeFinish = getTimeDifference(come.workedtime_time, leave.workedtime_time)
                
                obj['come' + count] = timeCome;
                obj['leave' + count] = timeLeave;
                obj['finishday' + count] = timeFinish;
                times.push(getTimeDifference(come.workedtime_time, leave.workedtime_time));
                
            } else if (!come && leave) {
                
                const timeLeave = splitDate(leave.workedtime_time)
                
                obj['come' + count] = '';
                obj['leave' + count] = timeLeave;
                obj['finishday' + count] = '00:00:00';
                
            } else if (!come && !leave && lastLeaveAfterCome) {

                const timeLeave = splitDate(lastLeaveAfterCome.workedtime_time);
                
                obj['come' + count] = '';
                obj['leave' + count] = timeLeave;
                obj['finishday' + count] = '00:00:00';

            } else if (!come && !leave && nextCome && !lastLeaveAfterCome) {
                
                obj['come' + count] = '';
                obj['leave' + count] = '';
                obj['finishday' + count] = '';
                
            } else if (!come && !leave && !nextCome && nextLatestLeave) {

                const timeLatestLeave = splitDate(nextLatestLeave.workedtime_time)
                
                obj['come' + count] = '';
                obj['leave' + count] = timeLatestLeave;
                obj['finishday' + count] = '00:00:00';
                
            } else if (!come && !leave && !nextCome && !nextLatestLeave) {
                
                obj['come' + count] = '';
                obj['leave' + count] = '';
                obj['finishday' + count] = '';
                
            } else if (come && !leave && lastLeaveAfterCome) {
                
                const timeCome = splitDate(come.workedtime_time)
                const timeLeaveAfterCome = splitDate(lastLeaveAfterCome.workedtime_time)
                
                obj['come' + count] = timeCome;
                obj['leave' + count] = timeLeaveAfterCome;
                obj['finishday' + count] = getTimeDifference(come.workedtime_time, lastLeaveAfterCome.workedtime_time);
                times.push(getTimeDifference(come.workedtime_time, lastLeaveAfterCome.workedtime_time));

            } else if (come && !leave && nextCome && !lastLeaveAfterCome) {

                const timeCome = splitDate(come.workedtime_time)
                
                obj['come' + count] = timeCome;
                obj['leave' + count] = '';
                obj['finishday' + count] = '00:00:00';

            } else if (come && !leave && !nextCome && nextLatestLeave) {

                const timeCome = splitDate(come.workedtime_time)
                const timeNextLatestLeave = splitDate(nextLatestLeave.workedtime_time)
                
                
                obj['come' + count] = timeCome;
                obj['leave' + count] = timeNextLatestLeave;
                obj['finishday' + count] = getTimeDifference(come.workedtime_time, nextLatestLeave.workedtime_time);
                times.push(getTimeDifference(come.workedtime_time, nextLatestLeave.workedtime_time));

            } else if (come && !leave && !nextCome && !nextLatestLeave) {

                const timeCome = splitDate(come.workedtime_time)
                
                obj['come' + count] = timeCome;
                obj['leave' + count] = '';
                obj['finishday' + count] = '00:00:00';

            }
            
            count += 1;
        }
        
        obj.finish = sumTimes(times);
        times = [];
        rows.push(obj);
        counter += 1;
    }
    
    worksheet.addRows(rows);
    
    
    await workbook.xlsx.writeFile('./xisobot.xlsx');
    console.log('tugadi');
})

module.exports = express