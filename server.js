/********************************************************************************
 *  WEB322 – Assignment 06
 *
 *  I declare that this assignment is my own work in accordance with Seneca's
 *  Academic Integrity Policy:
 *
 *  https://www.senecacollege.ca/about/policies/academic-integrity-policy.html
 *
 *  Name: Maryam Setayeshnia Student ID: 143893220 Date: 2024-04-12
 *  URL:  
 *
 ********************************************************************************/
const legoData = require("./modules/legoSets");

const express = require("express"); // "require" the Express module
const authData = require('./modules/auth-service');
const path = require("path");
const clientSessions = require("client-sessions");

const app = express(); // obtain the "app" object
app.set("view engine", "ejs");

const HTTP_PORT = process.env.PORT || 8080; // assign a port

app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));

 // client sessions middleware
 app.use(
  clientSessions({
    cookieName: 'session',
    secret: 'o6LjQ5EVNC28ZgK64hDELM18ScpFQr',
    duration: 2 * 60 * 1000, 
    activeDuration: 1000 * 60 
  })
);
// Add session object to locals
app.use((req, res, next) => {
res.locals.session = req.session;
next();
});
// enusreLogin middleware

function ensureLogin(req, res, next) {
if (!req.session.user) {
  res.redirect('/login');
} else {
  next();
}
}
// login route
app.get("/login", (req, res) => {
  res.render("login" , { successMessage: "", errorMessage: "" });
});

// register route
app.get("/register", (req, res) => {
  res.render("register", { successMessage: "", errorMessage: "" });
});

// user register
app.post("/register", (req, res) => {
  authData.registerUser(req.body)
    .then(() => {
      res.render("register", { successMessage: "User created", errorMessage: ""  });
    })
    .catch((err) => {
      res.render("register", { successMessage: "", errorMessage: err, userName: req.body.userName });
    });
})

// user login
app.post("/login", (req, res) => {
  req.body.userAgent = req.get('User-Agent'); 
  authData.checkUser(req.body)
    .then((user) => {
      req.session.user = {
        userName: user.userName,
        email: user.email,
        loginHistory: user.loginHistory
      };
      res.redirect('/lego/sets');
    })
    .catch((err) => {
      res.render("login", { successMessage: "",errorMessage: err, userName: req.body.userName });
    });
});

// logout route
app.get("/logout", (req, res) => {
  req.session.reset();
  res.redirect('/');
});

// view user history
app.get("/userHistory", ensureLogin, (req, res) => {
  res.render("userHistory");
});


// adding a new set 
app.get("/lego/addSet", ensureLogin, (req, res) => {
  legoData.getAllThemes()
  .then(themes => {
      res.render("addSet", { themes: themes });
  })
  .catch(error => {
      console.error(error);
      res.render("500");
  });
});
// submitting the new set
app.post("/lego/addSet", ensureLogin, (req, res) => {
  legoData.addSet(req.body)
      .then(() => {
          res.redirect("/lego/sets");
      })
      .catch(error => {
          console.error(error);
          res.render("500", { message: `I'm sorry, but we have encountered the following error: ${error}` });
      });
});
// editing the set by the set_num 
app.get("/lego/editSet/:num", ensureLogin, async (req, res) => {
  const set = await legoData.getSetByNum(req.params.num)
  .then(data => data)
  .catch(error => {
      console.error(error);res.status(404).render('404', {message: error});
  });
  const themes = await legoData.getAllThemes()
  .then(data => data )
  .catch(error => {
    console.error(error);res.status(404).render('404', {message: error});
  });

  console.log(set);

  res.render("editSet", { themes, set  });
});
// submit the edit form
app.post("/lego/editSet/", ensureLogin, (req, res) => {
  console.log("this is the request.body");
  console.log(req.body)
  legoData
    .editSet(req.body.set_num, req.body)
    .then(() => res.redirect("/lego/sets"))
  .catch((error) => {
      res.render("500", { message: `I'm sorry, but we have encountered the following error: ${error}` });
  }); 
});
// delete a set by the set_num
app.get("/lego/deleteSet/:num", ensureLogin, (req, res) => {
  legoData.deleteSet(req.params.num)
      .then(() => {
          res.redirect("/lego/sets");
      })
      .catch(error => {
          console.error(error);
          res.render("500", { message: `I'm sorry, but we have encountered the following error: ${error}` });
      });
});
// getting the root route, the main page
app.get('/', (req, res) => {
    res.render('home');
  });
// getting the about page
  app.get('/about', (req, res) => {
    res.render('about');
  });
// get either all sets or filtered by their theme 
app.get('/lego/sets', (req, res) => {
    console.log(req.query);
    if (req.query.theme){
      legoData.getSetsByTheme(req.query.theme)
      .then(themeSets => {
        res.render('sets', {legoSets: themeSets});
      })
      .catch(error => {
          console.error(error);res.status(404).render('404', {message: error}); 
      });
    }
    else {
      legoData.getAllSets()
      .then(sets => {
          res.render('sets', {legoSets: sets});
      })
      .catch(error => {
          console.error(error);
          res.status(404).render('404', {message: error});
      });
    }
  });
// getting a set by the set_num
app.get('/lego/sets/:set_num', (req, res) => {
    legoData.getSetByNum(req.params.set_num)
    .then(set => {
      res.render('set', {legoSet: set});
    })
    .catch(error => {
        console.error(error);
        res.status(404).render('404', {message:error});
    });
  });

  app.use((req, res, next) => {
    res.status(404).render("404", {
      message: "I'm sorry, we're unable to find what you're looking for.",
    });
  });
 
  /*legoData.initialize().then(app.listen(HTTP_PORT, () =>
      console.log(`server listening on: ${HTTP_PORT}`)
    )
  );*/
  legoData.initialize()
    .then(authData.initialize) 
    .then(function(){
        app.listen(HTTP_PORT, function(){
            console.log(`app listening on: ${HTTP_PORT}`);
        });
    })
    .catch(function(err){
        console.log(`unable to start server: ${err}`);
    });