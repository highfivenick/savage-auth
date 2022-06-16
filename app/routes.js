module.exports = function(app, passport, db, multer, ObjectId) {

  // Image Upload Code =========================================================================
 var storage = multer.diskStorage({
   destination: (req, file, cb) => {
     console.log('dest', file)
     cb(null, `public/folders/${file.title}`)
   },
   filename: (req, file, cb) => {
     cb(null, file.originalname)
   }
 });
 var upload = multer({storage: storage}); 
 
 // normal routes ===============================================================
 
     // show the home page (will also have our login links)
     app.get('/', function(req, res) {
         res.render('index.ejs');
     });
 
     // PROFILE SECTION =========================
     app.get('/projects', isLoggedIn, function(req, res) {
         db.collection('folders').find({postedBy: req.user._id}).toArray((err, result) => {
           if (err) return console.log(err)
           res.render('projects.ejs', {
             user : req.user,
             folders: result
           })
         })
     });
     //main page
  //    app.get('/projects', function(req, res) {
  //      db.collection('projects').find().toArray((err, result) => {
  //        if (err) return console.log(err)
  //        res.render('projects.ejs', {
  //          folders: result
  //        })
  //      })
  //  });
   //post page
   app.get('/release/:zebra', isLoggedIn, function(req, res) {
     let postId = ObjectId(req.params.zebra)
     console.log(postId)
     db.collection('folders').find({_id: postId}).toArray((err, result) => {
       if (err) return console.log(err)
       res.render('release.ejs', {
         folders: result
       })
     })
 });
 //profile page
 app.get('/page/:id', isLoggedIn, function(req, res) {
   let postId = ObjectId(req.params.id)
   db.collection('folders').find({postedBy: postId}).toArray((err, result) => {
     if (err) return console.log(err)
     res.render('page.ejs', {
       folders: result
     })
   })
 });
 
     // LOGOUT ==============================
     app.get('/logout', function(req, res) {
         req.logout();
         res.redirect('/');
     });
 // post routes
 app.post('/makePost', isLoggedIn, upload.array('fileList'), (req, res) => {
   let user = req.user._id
   console.log('uploaded file', req.files)
   db.collection('folders').save({title: req.body.title, folder: 'folders/uploads/' + req.files.filename, postedBy: user}, (err, result) => {
     if (err) return console.log(err)
     console.log('saved to database')
     res.redirect('/projects')
   })
 })
 
 
 // message board routes ===============================================================
 
     app.post('/folders', (req, res) => {
       db.collection('folders').save({name: req.body.name, msg: req.body.msg, thumbUp: 0, thumbDown:0}, (err, result) => {
         if (err) return console.log(err)
         console.log('saved to database')
         res.redirect('/projects')
       })
     })
 
     app.put('/folders', (req, res) => {
       db.collection('folders')
       .findOneAndUpdate({name: req.body.name, msg: req.body.msg}, {
         $set: {
           thumbUp:req.body.thumbUp + 1
         }
       }, {
         sort: {_id: -1},
         upsert: true
       }, (err, result) => {
         if (err) return res.send(err)
         res.send(result)
       })
     })
 
     app.delete('/folders', (req, res) => {
       db.collection('folders').findOneAndDelete({name: req.body.name, msg: req.body.msg}, (err, result) => {
         if (err) return res.send(500, err)
         res.send('Message deleted!')
       })
     })
 
 // =============================================================================
 // AUTHENTICATE (FIRST LOGIN) ==================================================
 // =============================================================================
 
     // locally --------------------------------
         // LOGIN ===============================
         // show the login form
         app.get('/login', function(req, res) {
             res.render('login.ejs', { message: req.flash('loginMessage') });
         });
 
         // process the login form
         app.post('/login', passport.authenticate('local-login', {
             successRedirect : '/projects', // redirect to the secure profile section
             failureRedirect : '/login', // redirect back to the signup page if there is an error
             failureFlash : true // allow flash folders
         }));
 
         // SIGNUP =================================
         // show the signup form
         app.get('/signup', function(req, res) {
             res.render('signup.ejs', { message: req.flash('signupMessage') });
         });
 
         // process the signup form
         app.post('/signup', passport.authenticate('local-signup', {
             successRedirect : '/profile', // redirect to the secure profile section
             failureRedirect : '/signup', // redirect back to the signup page if there is an error
             failureFlash : true // allow flash folders
         }));
 
 // =============================================================================
 // UNLINK ACCOUNTS =============================================================
 // =============================================================================
 // used to unlink accounts. for social accounts, just remove the token
 // for local account, remove email and password
 // user account will stay active in case they want to reconnect in the future
 
     // local -----------------------------------
     app.get('/unlink/local', isLoggedIn, function(req, res) {
         var user            = req.user;
         user.local.email    = undefined;
         user.local.password = undefined;
         user.save(function(err) {
             res.redirect('/profile');
         });
     });
 
 };
 
 // route middleware to ensure user is logged in
 function isLoggedIn(req, res, next) {
     if (req.isAuthenticated())
         return next();
 
     res.redirect('/');
 }
 