const mongoose = require('mongoose');

const postSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    image: {
      type: String,
      required: true,
    },
    caption: {
      type: String,
      default: '',
      maxlength: 2200,
    },
    hashtags: [
      {
        type: String,
        lowercase: true,
        trim: true,
      },
    ],
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    commentsCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Extract hashtags before saving
postSchema.pre('save', function (next) {
  if (this.caption) {
    const regex = /#(\w+)/g;
    const matches = this.caption.match(regex);
    if (matches) {
      this.hashtags = matches.map((match) => match.replace('#', '').toLowerCase());
    } else {
      this.hashtags = [];
    }
  }
  next();
});

module.exports = mongoose.model('Post', postSchema);
