const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  roomNumber: {
    type: String,
    required: [true, 'Please provide a room number'],
    unique: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['Single', 'Double', 'Suite', 'Deluxe'],
    required: [true, 'Please specify room type']
  },
  pricePerNight: {
    type: Number,
    required: [true, 'Please provide price per night'],
    min: [0, 'Price must be greater than 0']
  },
  maxOccupants: {
    type: Number,
    required: [true, 'Please specify max occupants'],
    min: [1, 'Max occupants must be at least 1']
  },
  status: {
    type: String,
    enum: ['Available', 'Booked', 'Maintenance'],
    default: 'Available'
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  images: [{
    type: String,
    validate: {
      validator: function(v) {
        return /^(http|https):\/\/[^ "]+$/.test(v);
      },
      message: props => `${props.value} is not a valid URL!`
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Room', roomSchema);