var express = require('express');
var router = express.Router();
var productHelpers = require('../helpers/product-helpers');
var userHelpers = require('../helpers/user-helpers');
const { response } = require('../app');
const session = require('express-session');
const adminHelpers = require('../helpers/admin-helpers');

//middle ware to check the user login

const verifyLogin = (req, res, next) => {
  if (req.session.loggedIn) {
    next()
  }
  else {
    res.redirect('/login')
  }
}

/* GET home page. */
router.get('/products', async function (req, res, next) {
  //to check the user loggined
  let cartCount = null
  if (req.session.user) {
    cartCount = await userHelpers.getCartCount(req.session.user._id)
    console.log(cartCount)
  }

  let user = req.session.user;

  productHelpers.getSelectionAllProducts().then((products) => {


    res.render('user/view-product', { products, user, cartCount })

  })

});
router.get('/login', (req, res) => {

  if (req.session.loggedIn) {

    res.redirect('/')
  }
  else {

    res.render('user/login', { "loginErr": req.session.loginErr })
    req.session.loginErr = false;
  }

})
router.get('/signup', (req, res) => {
  res.render('user/signup')
})
router.post('/signup', (req, res) => {
  userHelpers.doSignup(req.body).then(async (response) => {
    console.log(response)
    
    res.redirect('/login');


  })

})
router.post('/login', (req, res) => {

  if (req.session.user) {
    redirect('/')
  }
  else {
    userHelpers.doLogin(req.body).then(async (response) => {
      if (response.status) {

        console.log(response.user)
        await (req.session.loggedIn = true,


          req.session.user = response.user)


        res.redirect('/');
      }
      else {
        req.session.loginErr = "Invlid username or password!!"
        res.redirect('/login');


      }
    })
  }
})
router.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/')
})
router.get('/cart', verifyLogin, async (req, res) => {
  let products = await userHelpers.getCartProduct(req.session.user._id)
  if (products.length >= 1) {
    let { total, cartStatus } = await userHelpers.getTotalAmount(req.session.user._id)
    res.render('user/cart', { products, user: req.session.user, total, cartStatus })
  }
  else {
    let total = 0
    let cartStatus = false
    res.render('user/cart', { products, user: req.session.user, total, cartStatus })
  }


})

router.get('/add-to-cart/:id', verifyLogin, (req, res) => {

  console.log("api call")
  userHelpers.addToCart(req.params.id, req.session.user._id).then((newlyadded) => {
    console.log(newlyadded)

    res.json({ status: true, newlyadded })
  })

})
router.post('/change-product-quantity', (req, res, next) => {
  console.log(req.body)
  userHelpers.changeProductQuantity(req.body).then(async (status) => {
    console.log('remove product is' + status.removeStatus)

    let { total, cartStatus } = await userHelpers.getTotalAmount(req.body.user)
    let response = {
      total: total,
      cartStatus: cartStatus,
      removeStatus: status.removeStatus
    }
    res.json(response)


  })
})

router.get('/place-order', verifyLogin, async (req, res) => {

  let totalAmount = await userHelpers.getTotalAmount(req.session.user._id)
  total = totalAmount.total
  res.render('user/place-order', { total, user: req.session.user })
})
router.post('/remove-product', (req, res, next) => {
  console.log(req.body)
  userHelpers.removeProduct(req.body).then((response) => {
    console.log('remove status is' + response.removeStatus)
    res.json(response)
  })

}
)

router.post('/checkout', verifyLogin, async (req, res) => {
  console.log(req.body.userId)
  let products = await userHelpers.getCartProductList(req.body.userId)
  let totalPrice = await userHelpers.getTotalAmount(req.body.userId)
  totalAmount = totalPrice.total

  userHelpers.placeOrder(req.body, products, totalAmount).then((response) => {
    console.log('order details' + response.status)
    res.json({ status: true })

  })

})

router.get('/order-success', verifyLogin, (req, res) => {
  res.render('user/order-success', { user: req.session.user })
})

router.get('/orders', verifyLogin, async (req, res) => {
  let orders = await userHelpers.getUserOrders(req.session.user._id)

  res.render('user/orders', { user: req.session.user, orders })

})
router.get('/view-order-products/:id', verifyLogin, async (req, res) => {

  let products = await userHelpers.getOrderProducts(req.params.id)

  console.log(products)
  res.render('user/veiw-order-products', { user: req.session.user, products })
})
router.get('/',async(req,res)=>{
  let cartCount = null
  if (req.session.user) {

   cartCount = await userHelpers.getCartCount(req.session.user._id)
    
  }

  let user = req.session.user

  productHelpers.getSelectionAllProducts().then((products) => {

  adminHelpers.getAllTrendings().then((trendings)=>{
    res.render('user/cover-page', { products, user, cartCount,trendings })
  })
  
  })
  
})

module.exports = router;
