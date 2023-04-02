const digestRequest = require('request-digest')('admin', 'pok4747Z');
const express = require('express').Router()
const { uniqRow } = require('../lib/pg');

// const domain = 'http://172.20.10.8' 
const domain = 'http://192.168.1.188' 

express.get('/import/:from/:to', async (req, res) => {
    try {
        const { from, to } = req.params
        
        const response = digestRequest.requestAsync({
            host: domain,
            path: '/ISAPI/AccessControl/UserInfo/Count?format=json',
            method: 'GET',
            port:80
        })
        let data = await response
        data = JSON.parse(data.body).UserInfoCount.userNumber
        console.log(data, "HODIMLAR");
        for (let i = 1; i < data; i++) {
            const response = digestRequest.requestAsync({
                host: domain,
                path: '/ISAPI/AccessControl/UserInfo/Search?format=json',
                method: 'POST',
                port: 80,
                json: true,
                body: {
                    "UserInfoSearchCond":{
                        "searchID":"1",
                        "searchResultPosition": i,
                        "maxResults": 1
                    }
                },
                headers: {
                    'Content-Type': 'application/json'
                }
            })
            let data = await response
            data = data.body
            data = data.UserInfoSearch.UserInfo[0]
            
            const user = await uniqRow('select * from users where user_id = $1', data.employeeNo)
            if (!user.rows.length) {
                await uniqRow('insert into users (user_id, user_fullname) values ($1, $2)', data.employeeNo, data.name)
                console.log(`QO'SHILDI`)
            } else {
                console.log(`BOR EKAN`)
            }
        }

        const eventNum = digestRequest.requestAsync({
            host: domain,
            path: '/ISAPI/AccessControl/AcsEventTotalNum?format=json',
            method: 'POST',
            port:80,
            json: true,
            body: {
                "AcsEventTotalNumCond":{
                    "major": 5,
                    "minor": 75,
                    "startTime": from + "T00:00:00+07:00",
                    "endTime": to + "T22:59:59+07:00"
                }
            },
            headers: {
                'Content-Type': 'application/json'
            }
        })
        let eventNumBody = await eventNum
        eventNumBody = eventNumBody.body.AcsEventTotalNum.totalNum
        console.log(eventNumBody, "EVENTLAR");
        for (let i = 1; i < eventNumBody; i++) {
            const eventResponse = digestRequest.requestAsync({
                host: domain,
                path: '/ISAPI/AccessControl/AcsEvent?format=json',
                method: 'POST',
                port: 80,
                json: true,
                body: {
                    "AcsEventCond": {
                        "searchID": "1",
                        "searchResultPosition": i,
                        "maxResults": 1,
                        "major": 5,
                        "minor": 75,
                        "startTime": from + "T00:00:00+07:00",
                        "endTime": to + "T22:59:59+07:00"
                    }
                },
                headers: { 
                    'Content-Type': 'application/json'
                }
            })
            let event = await eventResponse
            event = event.body.AcsEvent.InfoList[0]
            const time = await uniqRow('select * from workedtimes where user_id = $1 and workedtime_time = $2', event.employeeNoString, event.time)
            if (!time.rows.length) {
                await uniqRow('insert into workedtimes (workedtime_time, workedtime_action, user_id) values ($1, $2, $3)', event.time, event.attendanceStatus, event.employeeNoString)
                console.log(`QO'SHILDI`)
            } else {
                console.log(`BOR EKAN`)
            }
        }
        console.log("TUGADI");
    } catch (error) {
        console.log(error);
    }
})

module.exports = express