const mongoose = require('mongoose');

const blogSchema = mongoose.Schema({
	title: {type: String, required: true},
	content: String,
	author: {
		firstname: String,
		lastname: String
	},
	created: {type: Date, default: Date.now}
});

blogSchema.virtual('authorFullname').get(function() {
	return `${this.author.firstname} ${this.author.lastname}`;
});

blogSchema.methods.apiRepr = function() {
	return {
		id: this._id,
		title: this.title,
		content: this.content,
		author: this.authorFullname,
		created: this.created
	};
};

const BlogPost = mongoose.model('BlogPost', blogSchema);

module.exports = {BlogPost};