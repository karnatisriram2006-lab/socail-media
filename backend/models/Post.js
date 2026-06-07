const mongoose = require('mongoose');

const postSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    // Legacy field - kept as virtual for backward compat with old posts.
    // For new posts, use mediaUrl + mediaType.
    image: {
      type: String,
      required: false,
    },
    // New unified media fields
    mediaUrl: {
      type: String,
      default: '',
    },
    mediaType: {
      type: String,
      enum: ['image', 'video'],
      default: 'image',
    },
    // Thumbnail / poster image (used for videos)
    thumbnail: {
      type: String,
      default: '',
    },
    // Optional video metadata
    videoDuration: {
      type: Number, // seconds
      default: null,
    },
    videoWidth: {
      type: Number,
      default: null,
    },
    videoHeight: {
      type: Number,
      default: null,
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

// Backward-compat virtual: returns the URL to display as the post's "image".
// For image posts -> mediaUrl, for video posts -> thumbnail (poster frame).
postSchema.virtual('displayImage').get(function () {
  if (this.mediaType === 'video') {
    return this.thumbnail || this.mediaUrl || this.image;
  }
  return this.mediaUrl || this.image;
});

// Backward-compat alias: many existing frontends read `post.image`.
// We make this a real document property via pre-validation hook so it serializes.
postSchema.pre('validate', function (next) {
  if (!this.image) {
    if (this.mediaType === 'video') {
      this.image = this.thumbnail || this.mediaUrl || '';
    } else {
      this.image = this.mediaUrl || '';
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
  return this._isLiked || false;
});

// Virtual for checking if a user has saved this post
postSchema.virtual('isSaved').get(function () {
  return this._isSaved || false;
});

// Method to compute isLiked for a specific user
postSchema.methods.computeIsLiked = function (userId) {
  if (!userId) return false;
  return this.likes.some((like) => {
    const likeId = like && like._id ? like._id.toString() : like.toString();
    return likeId === userId.toString();
  });
};

// Method to compute isSaved for a specific user
postSchema.methods.computeIsSaved = function (userId) {
  if (!userId) return false;
  return false; // Will be set in controller
};

// Ensure virtuals are included in JSON
postSchema.set('toJSON', { virtuals: true });
postSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Post', postSchema);
