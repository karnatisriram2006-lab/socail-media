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
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
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

// Virtual for likes count
postSchema.virtual('likesCount').get(function () {
  return this.likes ? this.likes.length : 0;
});

// Virtual for checking if a user has liked this post
postSchema.virtual('isLiked').get(function () {
  // This will be set dynamically in controllers based on request user
  return this._isLiked || false;
});

// Virtual for checking if a user has saved this post
postSchema.virtual('isSaved').get(function () {
  return this._isSaved || false;
});

// Method to compute isLiked for a specific user
postSchema.methods.computeIsLiked = function (userId) {
  if (!userId) return false;
  return this.likes.some((like) => like.toString() === userId.toString());
};

// Method to compute isSaved for a specific user
postSchema.methods.computeIsSaved = function (userId) {
  if (!userId) return false;
  // This requires the user document to have savedPosts populated
  return false; // Will be set in controller
};

// Ensure virtuals are included in JSON
postSchema.set('toJSON', { virtuals: true });
postSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Post', postSchema);
