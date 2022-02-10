const path = require('path');

const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);
const csrf = require('csurf');
const flash = require('connect-flash');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');

const errorController = require('./controllers/error');
const User = require('./models/user');

const shopController = require('./controllers/shop');
const isAuth = require('./middleware/is-auth');

const MONGODB_URI = 'mongodb+srv://drakeln230:JelIvr3cgKCm3SZF@cluster0.ywr61.mongodb.net/shop'

const store = new MongoDBStore({
  uri: MONGODB_URI,
  collection: 'mySessions',
});


const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'images');
  },
  filename: (req, file, cb) => {
    cb(null, uuidv4() + '-' + file.originalname);
  }
});

const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === 'image/png' ||
    file.mimetype === 'image/jpg' ||
    file.mimetype === 'image/jpeg'
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};


const app = express();

app.set('view engine', 'ejs');
app.set('views', 'views');

const adminRoutes = require('./routes/admin');
const shopRoutes = require('./routes/shop');
const authRoutes = require('./routes/auth');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(
  multer({ storage: fileStorage, fileFilter: fileFilter }).single('image')
);
app.use(express.static(path.join(__dirname, 'public')));
app.use('/images',express.static(path.join(__dirname, 'images')));
app.use(
  session({secret: 'drakeln230', 
  resave: false, // It basically means that for every request to the server, it reset the session cookie.
  saveUninitialized: false, // the session cookie will not be set on the browser
  store: store
  })
);



app.use(flash());


app.use((req, res, next) => {
  if (!req.session.user) {
    return next();
  }
  User.findById(req.session.user._id)
    .then(user => {
      if (!user) {
        return next();
      }
      req.user = user;
      next();
    })
    .catch(err => {
      next(new Error(err))
    });
});

app.post('/create-order', isAuth, shopController.postOrder);

app.use(csrf())
app.use((req, res, next) => {
  res.locals.isAuthenticated = req.session.isLoggedIn
  res.locals.csrfToken = req.csrfToken()
  next()
});

app.use('/admin', adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);

app.get('/500', errorController.get500)

app.use(errorController.get404);

app.use((err, req, res, next) => {
  res.status(500).render('500', { 
    pageTitle: 'Error!', 
    path: '/500',  
    isAuthenticated: req.session.isLoggedIn
  });
  // res.render('/500');
});

mongoose.connect('mongodb+srv://drakeln230:JelIvr3cgKCm3SZF@cluster0.ywr61.mongodb.net/shop?retryWrites=true&w=majority')
  .then(result => {
    app.listen(3000)
  })
  .catch(err => console.log(err))