require('dotenv').config({ path: `.env.${process.env.NODE_ENV || 'development'}.local` });

const jwt = require('jsonwebtoken');

async function createToken(id) {
    try {
        const token = await jwt.sign({ id: id }, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRATION,
        });
        return token;
    } catch (error) {
        console.log(error);
    }
}

async function tokenVerifer(token) {
    try {
        const verifed = await jwt.verify(token, process.env.JWT_SECRET);
        return verifed;
    } catch (error) {
        if (error.expiredAt) {
            return {
                status: 402,
            };
        }
    }
}

module.exports = {
    createToken,
    tokenVerifer,
};
