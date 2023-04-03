function daysInThisMonth() {
    var now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
}

function getTimeDifference(dateStr1, dateStr2) {
    const date1 = new Date(dateStr1);
    const date2 = new Date(dateStr2);
    const diffInMs = Math.abs(date2 - date1);
    const hours = Math.floor(diffInMs / 3600000);
    const minutes = Math.floor((diffInMs % 3600000) / 60000);
    const seconds = Math.floor((diffInMs % 60000) / 1000);
    const formattedMinutes = (minutes < 10 ? '0' : '') + minutes;
    const formattedSeconds = (seconds < 10 ? '0' : '') + seconds;
    return hours + ':' + formattedMinutes + ':' + formattedSeconds;
}

function sumTimes(timeArray) {
    let totalSeconds = 0;
    timeArray.forEach(time => {
        const [hours, minutes, seconds] = time.split(':');
        totalSeconds += +hours * 3600 + +minutes * 60 + +seconds;
    });

    const hours = Math.floor(totalSeconds / 3600)
        .toString()
        .padStart(2, '0');
    const minutes = Math.floor((totalSeconds % 3600) / 60)
        .toString()
        .padStart(2, '0');
    const seconds = (totalSeconds % 60).toString().padStart(2, '0');

    return `${hours}:${minutes}:${seconds}`;
}

function getDaysBetweenDates(dateStr1, dateStr2) {
    const date1 = new Date(dateStr1.split('-').reverse().join('-'));
    const date2 = new Date(dateStr2.split('-').reverse().join('-'));

    const diffMs = Math.abs(date2 - date1);

    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    return diffDays;
}

function dateRange(start, end) {
    const startDate = new Date(start.split('-').reverse().join('-'));
    const endDate = new Date(end.split('-').reverse().join('-'));
    const dates = [];

    while (startDate <= endDate) {
        dates.push(startDate.toISOString().slice(0, 10).split('-').reverse().join('-'));
        startDate.setDate(startDate.getDate() + 1);
    }

    return dates;
}

function extractString(str) {
    return str.replace(/[0-9]/g, '');
}

function splitDate(str) {
    return str.split('T')[1].split('+')[0];
}

module.exports = {
    daysInThisMonth,
    getTimeDifference,
    sumTimes,
    getDaysBetweenDates,
    dateRange,
    extractString,
    splitDate
};
