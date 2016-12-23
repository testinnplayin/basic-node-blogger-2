'use strict';

const express = require('express');
const morgan = require('morgan');

const {PORT, DATABASE_URL} = require('./config');

const app = express();

app.use(morgan('common'));

const bodyParser = require('body-parser');
app.use(bodyParser.json());

const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

const {BlogPost} = require('./models');

//CRUD functions

//reading

app.get('/posts', (req, res) => {
	BlogPost
		.find()
		.exec()
		.then(blogs => {
			res.json({
				blogs: blogs.map(function(blog) {
					blog.apiRepr();
				})
			});
		})
		.catch(err => {
			console.error(err);
			res.status(500).json({ message: 'Internal server error' });
		});
});

app.get('/posts/:id', (req, res) => {
	BlogPost
		.findById(req.params.id)
		.exec()
		.then(blog => res.json(blog.apiRepr()))
		.catch(err => {
			console.error(err);
			res.status(500).json({ message: 'Internal server error'});
		});
});

//create

app.post('/posts', (req, res) => {
	const requiredFields = ['title', 'content', 'author'];
	requiredFields.forEach(field => {
		if (!(field in req.body && req.body[field])) {
			return res.status(400).json({ message: `Please enter a valid ${field}`});
		}
	});

	BlogPost
		.create({
			title: req.body.title,
			content: req.body.content,
			author: req.body.author
		})
		.then(blog => {
			res.status(201).json(blog.apiRepr());
		})
		.catch(err => {
			console.error(err);
			res.status(500).json({ message: 'Internal server error' });
		});
});

//update

app.put('/posts/:id', (req, res) => {
	if (!(req.params.id && req.body.id && (req.params.id === req.body.id))) {
		const message = (
			`Request path id (${req.params.id}) and request body id` +
			`(${req.body.id}) must match`
		);
		console.error(message);
		res.status(400).json({ message: message});
	}

	const updateData = {};
	const updateFields = ['title', 'content', 'author'];

	updateFields.forEach(field => {
		if (field in req.body) {
			updateData[field] = req.body[field];
		}
	});

	BlogPost
		.findByIdAndUpdate(req.params.id, {$set: updateData}, {nes: true})
		.exec()
		.then(updatedPost => {
			res.status(201).json(updatedPost.apiRepr());
		})
		.catch(err => {
			res.status(500).json({message: 'Internal server error'});
		});
});

//delete

app.delete('/posts/:id', (req, res) => {
	Restaurant
		.findByIdAndRemove(req.params.id)
		.exec()
		.then(() => {
			res.status(204).json({ message: 'successfully deleted' });
		})
		.catch(err => {
			console.error(err);
			res.status(500).json({ message: 'Internal server error' });
		});
});

app.use('*', function(req, res) {
	res.status(404).json({ message: 'Not Found'});
});


let server;

function runServer() {
	return new Promise((resolve, reject) => {
		mongoose.connect(DATABASE_URL, function(err) {
			if (err) {
				return reject(err);
			}

			server = app.listen(PORT, function() {
				console.log(`Your app is listening on port ${PORT}`);
				resolve();
			})
			.on('error', function(err) {
				mongoose.disconnect();
				reject(err);
			});
		});
	});
}

function closeServer() {
	return mongoose.disconnect()
		.then(() => {
			return new Promise((resolve, reject) => {
				console.log('Closing server');
				server.close(function(err) {
					if (err) {
						return reject(err);
					}

					resolve();
				});
			});
		});
}

if (require.main === module) {
	runServer().catch(err => console.error(err));
}

module.exports = {app, runServer, closeServer};