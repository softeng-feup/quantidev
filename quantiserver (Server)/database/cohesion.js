var mongoose = require('mongoose');

var CohesionSchema = new mongoose.Schema({
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    sprint: { type: mongoose.Schema.Types.ObjectId, ref: 'Sprint', required: true },
    answers: [{
        question: { type: Number, required: true },
        answer: { type: Number, required: true }
    }],
    date: { type: Date, required: true, default: Date.now() }
});

CohesionSchema.methods.summary = function() {
    return {
        user: this.owner.username,
        score: this.score()
    };
};

CohesionSchema.methods.score = function() {
    var score = 0;

    var task = 0;
    var social = 0;
    var attractiveness = 0;

    this.answers.forEach(function(c) {
        score += c.answer;

        if (c.question <= 4)
            task += c.answer;
        else if (c.question <= 7)
            social += c.answer;
        else
            attractiveness += c.answer;
    });

    return {
        total: score,
        task: task,
        social: social,
        attractiveness: attractiveness
    };
};

module.exports = mongoose.model('Cohesion', CohesionSchema);