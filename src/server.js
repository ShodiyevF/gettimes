const express = require('express')
const app = express()

const importTimes = require('./modules/import')
const exportTimes = require('./modules/export')

app.use(express.json())
app.use(importTimes)
app.use(exportTimes)


app.listen(4002, console.log(4002))