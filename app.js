const express = require('express')
const app = express()
const mongoose = require('mongoose')
const methodOverride = require('method-override')


app.use(express.json());  // allows us to recognize the incoming request as a JSON object. 
app.use(express.urlencoded({extended: false})); //  recognize the incoming object as strings or arrays.
app.use(express.static(__dirname + '/public'));  // ???
app.use(methodOverride('_method'))

//set the template engine ejs
app.set('view engine', 'ejs')

//middlewares
app.use(express.static('public'))


//routes
app.get('/', (req, res) => {
	res.render('index')
})

//Listen on port 3000
server = app.listen(process.env.PORT || 3000)
// const PORT = process.env.PORT || 3000;

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/'+ 'messages';

// Connect to Mongo
mongoose.connect(MONGODB_URI,  { useNewUrlParser: true,  useUnifiedTopology: true});

const db = mongoose.connection
////////
// Error / success
db.on('error', (err) => console.log(err.message + ' is Mongod not running?'));
db.on('connected', () => console.log('mongo connected: ', MONGODB_URI));
db.on('disconnected', () => console.log('mongo disconnected'));

// open the connection to mongo
db.on('open' , ()=>{});

//socket.io instantiation
const io = require("socket.io")(server)


//MONGOOSE?!
mongoose.connection.once('open', ()=> {
    console.log('connected to mongo');
});

// importing the message model
const Message = require('./models/messages.js')

app.get('/messages', (req, res)=>{
    Message.find({}, (error, allMessages)=>{
      res.render('index.ejs', {
        allMessages: allMessages
        })
    })
  })
  
  app.get('/', (req, res)=>{   //INITIAL LOGIN
   
      res.redirect('/messages')
  
  })
  
  
 
app.get('/messages/boards', (req, res)=>{
    Message.find({}, (error, allMessages)=>{
      res.render('/messages/boards', {
        allMessages: allMessages
        })
    })
  })
  
  ///////
  //NEW//
  ///////
  app.get('/messages/new', (req, res) => {
    res.render('new.ejs');
    //res.send('new') send string of new to test
  })
  
  //////////
  //CREATE//
  ///post///
  app.post('/messages/', (req, res)=>{    //Post is an express method to POST
    if(req.body.userType === 'on'){ //if checked, req.body.readyToEat is set to 'on'
      req.body.userType = true;
    } else { //if not checked, req.body.readyToEat is undefined
      req.body.userType = false;
    }
    Message.create(req.body, (error, createdMessage)=>{
      res.redirect('/messages');
    })
  })
  
  /////////////
  /// edit ////
  /////////////
  // app.get('/messages/:id/edit', (req, res)=>{
    app.get('/messages/:id/edit', (req, res)=>{
    Message.findById(req.params.id, (err, foundMessage)=>{ //find the Message
        res.render('edit.ejs', 
          { message: foundMessage, //pass in found message 
        })
    })
  })
  
  ///////////
  // update//
  ///////////
  app.put('/messages/:id', (req, res)=>{
    if(req.body.readyToEat === 'on'){
        req.body.readyToEat = true;
    } else {
        req.body.readyToEat = false;
    }
    Message.findByIdAndUpdate(req.params.id, req.body, { new: true }, (err, updatedModel)=> {
      res.redirect('/messages');
    })
  })
  
  //////////
  // show///
  //////////
  app.get('/messages/:id', (req, res) =>{
    Message.findById(req.params.id, (err, foundMessage)=>{
      res.render('show.ejs', {
        message: foundMessage,
      })
    })
  })
  
  ////////////
  // delete //
  app.delete('/messages/:id', (req, res) => {
    Message.findByIdAndRemove(req.params.id, { useFindAndModify: false }, (err, data)=>{
      res.redirect('/messages') //redirect back to Message index
    })
  })
  
  ////CHANGE LIKES
  app.patch('/messages/:id', (req,res) => {
    console.log(req.body)
    Message.findByIdAndUpdate(req.params.id, {$inc: {'likes': +1}}, (err) => {
      if (err) {
        console.log(err)
      } else {
        res.redirect(`/messages`)
      }
    })
  })




//listen on every connection
io.on('connection', (socket) => {
	console.log('New user connected')

	//default username
	socket.username = "Anonymous"

    //listen on change_username
    socket.on('change_username', (data) => {
        socket.username = data.username
    })

    //listen on new_message
    socket.on('new_message', (data) => {
        //broadcast the new message
        io.sockets.emit('new_message', {message : data.message, username : socket.username});
    })

    //listen on typing
    socket.on('typing', (data) => {
    	socket.broadcast.emit('typing', {username : socket.username})
    })
})