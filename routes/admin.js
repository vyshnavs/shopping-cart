var express = require('express');
var router = express.Router();
var productHelpers=require('../helpers/product-helpers');
var adminHelpers=require('../helpers/admin-helpers');
var userHelpers=require('../helpers/user-helpers');
var app=require('../app');

const mime = require('mime-types');

const verifyLogin = (req, res, next) => {
  if (req.session.adminLoggedIn) {
    next()
  }
  else {
    res.redirect('/admin/login')
  }
}
/* GET users listing. */
router.get('/allProducts',verifyLogin, function (req, res, next) {
 
  productHelpers.getSelectionAllProducts().then((products)=>{
    
    res.render('admin/view-products', { products, forAdmin: true,admin })
  })


  

});

router.get('/add-product', function (req, res) {
  res.render('admin/add-product')
})



router.post('/add-product',(req, res) => {
  
 
  productHelpers.addProduct(req.body,(id)=>{
    console.log(req.body)
    console.log(__filename);
    let image=req.files.Image;
    image.mv('./public/product-images/'+id+".jpg",(err)=>{
      if(!err){
        res.render('admin/add-product')}
      else{
        console.log(err)}
    })

    
    
    
  });
 

});

router.get('/delete-product/:id',(req,res)=>{

let proId=req.params.id

console.log(proId)
productHelpers.deleteProduct(proId).then((response)=>{
 res.redirect('/admin/')

})
})
router.get('/edit-product/:id',async (req,res)=>{
  let product=productHelpers.getProductDetails(req.params.id).then((product)=>{
    console.log(product)
    res.render('admin/edit-product',{product})
  })
  
})
router.post('/edit-product/:id',(req,res)=>{
  console.log(req.params.id)
  let id=req.params.id
  productHelpers.updateProduct(req.params.id,req.body).then(()=>{
    res.redirect('/admin')
   
    if(req.files&&req.files.Image)
      {
        let image=req.files.Image
        image.mv('./public/product-images/'+id+".jpg",(err)=>{
          
        })
    
      }
      
  })
})
router.get('/',(req,res)=>{
  admin=req.session.admin;
  res.render('admin/admin-welcome',{forAdmin:true,admin})
})

router.get('/login',(req,res)=>{
 
 
    if (req.session.adminLoggedIn) {
  
      res.redirect('/all products')
    }
    else {
  
      res.render('admin/login', { "loginErr": req.session.loginErr,forAdmin:true })
      req.session.loginErr = false;
    }
  
  })
  router.get('/signup', (req, res) => {
    res.render('admin/signup',{forAdmin:true})
  })

  router.post('/signup', (req, res) => {
    adminHelpers.doSignup(req.body).then(async (response) => {
      console.log(response)
      await (req.session.adminLoggedIn = true,
  
        req.session.admin = response)
  
      res.redirect('/admin');

    })
  
  })

  router.post('/login', (req, res) => {

    if (req.session.admin) {
      redirect('/admin')
    }
    else {
         adminHelpers.doLogin(req.body).then(async (response) => {
        if (response.status) {
  
          console.log(response.admin)
          await (req.session.adminLoggedIn = true,
  
  
            req.session.admin = response.admin)
             console.log(req.session.admin)
  
          res.redirect('/admin');
        }
        else {
          req.session.loginErr = "Invlid username or password!!"
          res.redirect('/admin/login');
  
  
        }
      })
    }
  })
  router.get('/logout', (req, res) => {
    req.session.destroy()
    res.redirect('/admin')
  })
router.get('/trending',verifyLogin,(req,res)=>{
 adminHelpers.getAllTrendings().then((trendings)=>{
  console.log('trending are'+trendings)
  res.render('admin/view-trending',{forAdmin:true,admin,trendings})
 })

})
router.get('/add-trending',verifyLogin,(req,res)=>{
  res.render('admin/add-trending',{forAdmin:true,admin})
})
router.post('/add-trending',verifyLogin,(req,res)=>{
  adminHelpers.addTrending(req.body,(id)=>{
    console.log(req.body)
    console.log(__filename);
    let image=req.files.Image;
    image.mv('./public/trending-images/'+id+".jpg",(err)=>{
      if(!err){
        res.render('admin/add-trending',{forAdmin:true,admin})}
      else{
        console.log(err)}
    })

    
    
    
  });
})

router.get('/users',verifyLogin,(req,res)=>{

 adminHelpers.getAllUsers().then((users)=>{
  res.render('admin/view-users',{forAdmin:true,users})
 })
  
})
router.get('/allOrders',verifyLogin,(req,res)=>{
adminHelpers.getAllOrders().then((orders)=>{
  res.render('admin/view-all-orders',{forAdmin:true,admin,orders})
})

})

router.get('/view-order-products/:id', verifyLogin, async (req, res) => {

  let products = await userHelpers.getOrderProducts(req.params.id)

  console.log(products)
  res.render('admin/view-order-products', { products ,forAdmin:true,admin})
})

module.exports = router;
