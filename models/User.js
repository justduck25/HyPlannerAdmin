const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  googleId: { type: String },
  facebookId: { type: String },
  fullName: { 
    type: String, 
    required: true 
  },
  email: {
    type: String,
    required: true,
    unique: true,
    match: [/\S+@\S+\.\S+/, "is invalid"],
  },
  password: { type: String },
  picture: { type: String },
  avatar: {
    type: String,
    default: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png'
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  accountType: {
    type: String,
    enum: ["FREE", "VIP", "SUPER"],
    default: "FREE",
  },
  accountExpires: {
    type: Date,
  },
  lastLogin: {
    type: Date,
    default: null
  }
}, {
  collection: "users",
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Remove password from JSON output
userSchema.methods.toJSON = function() {
  const userObject = this.toObject();
  delete userObject.password;
  return userObject;
};

module.exports = mongoose.model('User', userSchema);
