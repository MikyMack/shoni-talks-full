const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const adminSchema = new mongoose.Schema({
    username: { type: String, required: true },
    password: { type: String, required: true }
});

adminSchema.pre('save', async function(next) {
    if (!this.isModified('password')) {
        return next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

adminSchema.methods.comparePassword = function(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

const Admin = mongoose.model('Admin', adminSchema);

// Create a default admin user
(async () => {
    const existingAdmin = await Admin.findOne({ username: 'admin@divine.com' });
    if (!existingAdmin) {
        const admin = new Admin({ username: 'admin@divine.com', password: 'admin@admin' });
        await admin.save();
    }
})();

module.exports = Admin;
