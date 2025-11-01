const mongoose = require('mongoose');

const invitationLetterSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    templateId: {
      type: String,
      required: true,
    },
    groomName: {
      type: String,
      required: [true, "Vui lòng nhập tên chú rể"],
    },
    brideName: {
      type: String,
      required: [true, "Vui lòng nhập tên cô dâu"],
    },
    weddingDate: {
      type: String,
      required: true,
    },
    weddingTime: {
      type: String,
      required: true,
    },
    events: [
      {
        eventName: {
          type: String,
          required: true,
        },
        eventDate: {
          type: String,
          required: true,
        },
        eventTime: {
          type: String,
          required: true,
        },
        eventLocation: {
          type: String,
          required: true,
        },
      },
    ],
    customizations: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { collection: "invitationLetters", timestamps: true }
);

module.exports = mongoose.model("InvitationLetter", invitationLetterSchema);
