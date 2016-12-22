'use strict';

const express = require('express');
const morgan = require('morgan');

const {PORT, DATABASE_URL} = require('./config');

const app = express();

app.use(morgan('common'));

const bodyParser = require('body-parser');
const jsonParser = bodyParser.json();

const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

const {BlogPost} = require('./models');

//CRUD functions

app.get('/blog-posts', (req, res) => {
	BlogPost
		.find()
		.exec()
		.then(blogposts => {
			res.json({
				blogposts: blogposts.map(function(blogpost) {
					blogpost.apiRepr();
				})
			});
		})
		.catch(err => {
			console.error(err);
			res.status(500).json({ message: 'Internal server error' });
		});
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