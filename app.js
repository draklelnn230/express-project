const path = require('path');

const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);

const errorController = require('./controllers/error');
const User = require('./models/user');

const MONGODB_URI = 'mongodb+srv://drakeln230:JelIvr3cgKCm3SZF@cluster0.ywr61.mongodb.net/shop'

const store = new MongoDBStore({
  uri: MONGODB_URI,
  collection: 'mySessions',
});

const app = express();

app.set('view engine', 'ejs');
app.set('views', 'views');

const adminRoutes = require('./routes/admin');
const shopRoutes = require('./routes/shop');
const authRoutes = require('./routes/auth');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(
  session({secret: 'drakeln230', 
  resave: false, // It basically means that for every request to the server, it reset the session cookie.
  saveUninitialized: false, // the session cookie will not be set on the browser
  store: store
  })
);

app.use((req, res, next) => {
  if (!req.session.user) {
    return next();
  }
  User.findById(req.session.user._id)
    .then(user => {
      req.user = user;
      next();
    })
    .catch(err => console.log(err));
});




app.use('/admin', adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);

app.use(errorController.get404);

mongoose.connect('mongodb+srv://drakeln230:JelIvr3cgKCm3SZF@cluster0.ywr61.mongodb.net/shop?retryWrites=true&w=majority')
  .then(result => {
    User.findOne().then(user => {
      if (!user) {
        const user = new User({
          name: 'DSK',
          email: 'h.baolan20022@gmail.com',
          cart: {
            items: []
          }
        });
        user.save();
      }
    })
    app.listen(8080)
  })
  .catch(err => console.log(err))