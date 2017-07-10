var mongoose = require('mongoose');

var InteractionSchema = new mongoose.Schema({
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    intervenient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    rating: { type: Number, required: true },
    startDate: { type: Date, required: true },
    duration: { type: Number, required: true },
    notes: { type: String, required: false },
    shared: { type: Boolean, required: true, default: false },
    deleted: { type: Boolean, required: true, default: false }
});

InteractionSchema.methods.personalObject = function() {
    return {
        intervenient: {
            id: this.intervenient.id,
            name: this.intervenient.name,
            username: this.intervenient.username
        },
        identifier: this.id,
        rating: this.rating,
        startDate: this.startDate,
        duration: this.duration,
        notes: this.notes,
        shared: this.shared
    };
};

InteractionSchema.methods.shareableObject = function() {
    return {
        owner: {
            id: this.owner.id,
            name: this.owner.name,
            username: this.owner.username,
            team: this.owner.team
        },
        startDate: this.startDate,
        duration: this.duration,
        notes: this.notes
    };
};

module.exports = mongoose.model('Interaction', InteractionSchema);
