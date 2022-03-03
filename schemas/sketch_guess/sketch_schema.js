const mongoose = require('mongoose');

const sketchSchema = mongoose.Schema({

    currentWord: {
        type: String,
        required: true
    },
    currentDrawer: {
        type: String,
        required: true
    },
    previousDrawer: {
        type: String,
        required: true
    },
    urlId: {
        type: String,
        required: true
    },
    gameState: {
        type: Boolean,
        required: true
    },
    wasGuessed: {
        type: Boolean,
        required: true
    },
    hasEnded: {
        type: Boolean,
        required: true
    }

});

module.exports = mongoose.model('sketchguess', sketchSchema)