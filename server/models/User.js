const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: [true, 'User ID / Email is required'],
      unique: true,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
    },
    mobileNumber: {
      type: String,
      default: '',
    },
    name: {
      type: String,
      default: 'Lab User',
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      select: false,
    },
    role: {
      type: String,
      enum: ['admin', 'staff', 'programmer'],
      default: 'admin',
    },
    department: {
      type: String,
      default: 'Lab 12',
    },
    status: {
      type: String,
      enum: ['Active', 'On Leave'],
      default: 'Active',
    },
    permissions: [
      {
        type: String,
      },
    ],
  },
  {
    timestamps: true,
  }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
