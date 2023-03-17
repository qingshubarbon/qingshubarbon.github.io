const express = require('express');
const mysql = require('mysql2');
const session = require('express-session');
const bcrypt = require('bcrypt');
const app = express();

app.use(express.static('public'));
app.use(express.urlencoded({extended: false}));

app.use(
    session({
      secret: 'my_secret_key',
      resave: false,
      saveUninitialized: false,
    })
  );

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'sqlbeginneryuushi389297403:@/.',
    database: 'list_app'
});

connection.connect((err) => {
    if(err) {
        console.log('error connecting: ' + err.stack);
        return;
    }
    console.log('success');
});

app.use((req, res, next) => {
  if(req.session.userId === undefined) {
    res.locals.isLoggedIn = false;
  } else {
    res.locals.username = req.session.username;
    res.locals.isLoggedIn = true;
  }  
  next();
});

app.get('/', (req, res) => {
   res.render('top.ejs');
});

app.get('/signup', (req, res) => {
  const errors = [];
  res.render('signup.ejs', {errors: errors});
});

app.get('/login', (req, res) => {
  const errors = [];
  res.render('login.ejs', {errors: errors});
});

app.post('/signup', 
  (req, res, next) => {
    const username = req.body.username;
    const email = req.body.email;
    const password = req.body.password;

    const errors = [];

    if (username === '') {
      errors.push('ユーザー名が入力されていません');
    } 
    if (email === '') {
      errors.push('メールアドレスが入力されていません');
    } 
    if (password === '') {
      errors.push('パスワードが入力されていません');
    }

    if (errors.length > 0) {
      res.render('signup.ejs', {errors: errors});
    } else {
      next();
    }
  },
  (req, res, next) => {
    const email = req.body.email;
    const errors = [];
    connection.query(
      'SELECT * FROM users WHERE email=?',
      [email],
      (error, results) => {
        if (results.length > 0) {
          errors.push('そのメールアドレスは既に存在しています');
          res.render('signup.ejs', {errors: errors});
        } else {
          next();
        }
      }
    );
  },
  (req, res) => {
   const username = req.body.username;
   const email = req.body.email;
   const password = req.body.password;
   bcrypt.hash(password, 10, (error, hash) => {
    connection.query(
      'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
      [username, email, hash],
      (error, results) => {
         req.session.userId = results.insertId;
         req.session.username = username;
         res.redirect('/list');
      }
     );
    });  
});

app.post('/login',
 (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;

  const errors = [];

  console.log('入力値のチェック');

  if(email === '') {
    errors.push('メールアドレスが記入されていません');
  }

  if(password === '') {
    errors.push('パスワードが記入されていません');
  }

  if(errors.length > 0) {
    res.render('login.ejs', {errors: errors});
  } else {
    next();
  }

},
 (req, res) => {
  const email = req.body.email;
  const errors = [];

  connection.query(
    'SELECT * FROM users WHERE email=?',
    [email],
    (error, results) => {
      if(results.length > 0) {
       const plain = req.body.password;
       const hash = results[0].password;
       bcrypt.compare(plain, hash, (error, isEqual) => {
        if (isEqual) {
          req.session.userId = results[0].id;
          req.session.username = results[0].username;
          res.redirect('/list');
        } else {
          errors.push('パスワードが間違っています');
          res.render('login.ejs', {errors: errors});
        }
       });
      }
    } 
  );   
 }
);

app.get('/logout', (req, res) => {
  req.session.destroy((error) => {   
    res.redirect('/');
  });
});

app.get('/list', (req, res) => {
  connection.query(
    'SELECT * FROM foods ORDER BY date ASC',
    (error, results) => {
      res.render('list.ejs', {foods: results});
    }
  );
});

app.get('/new', (req, res) => {
  res.render('new.ejs');
});

app.post('/new', (req, res) => {
  connection.query(
    'INSERT INTO foods (item, count, date) VALUES (?, ?, ?)',
    [req.body.itemName, req.body.count, req.body.date],
    (error, results) => {
      res.redirect('/list');
    }
  );
});

app.post('/delete/:id', (req, res) => {
  connection.query(
    'DELETE FROM foods WHERE id=?',
    [req.params.id],
    (error, results) => {
      res.redirect('/list');
    }
  );
});

app.get('/edit/:id', (req, res) => {
  connection.query(
    'SELECT * FROM foods WHERE id=?',
    [req.params.id],
    (error, results) => {
      res.render('edit.ejs', {item: results[0]});
    }
  );
});

app.post('/edit/:id', (req, res) => {
  connection.query(
    'UPDATE foods SET item=?, count=?, date=? WHERE id=?',
    [req.body.itemName, req.body.count, req.body.date, req.params.id],
    (error, results) => {
      res.redirect('/list');
    }
  );
});



app.listen(3000);
