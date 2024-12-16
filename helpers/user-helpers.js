var db = require('../config/connection');
var collections = require('../config/collections');
const bcrypt = require('bcrypt');
const { get } = require('mongoose');
const ObjectId = require('mongodb').ObjectId;
module.exports = {
  doSignup: (userData) => {
    return new Promise(async (resolve, reject) => {
      //to encrypt the password
      userData.password = await bcrypt.hash(userData.password, 10)
      const collectionName = 'users';

      try {
        // Connect to the database
        const database = await db.connect();

        // Get the collection
        const collection = database.collection(collectionName);

        // Create a document to insert
        const user = {
          name: userData.name,
          email: userData.email,
          password: userData.password,

        };

        // Insert the user into the collection
        const result = await collection.insertOne(user);


        console.log("user inserted successfully:", user);

        id = result.insertedId;
        resolve(userData)

      } catch (error) {
        console.error("Failed to insert user:", error);
        // Handle the error and render an error page or send an error response
        res.status(500).send("Failed to add user. Please try again later.");
      }

    })
  },
  doLogin: (userData) => {
    return new Promise(async (resolve, reject) => {
      let loginStatus = false;
      let response = {};
      //take data from database
      let user = await db.get().collection(collections.USER_COLLECTION).findOne({ email: userData.Email });

      if (user) {
        //comparing the passwords.Bcrypt has internal promise function.
        bcrypt.compare(userData.Password, user.password).then((status) => {

          if (status) {
            console.log('login success');
            response.user = user;
            response.status = true
            resolve(response);
          }
          else {
            console.log('login failed');
            resolve({ status: false });

          }
        })
      }
      else {
        console.log('login failed');
        resolve({ status: false });

      }
    })
  },
  addToCart: (proId, userId) => {

    let proObj = {
      item: new ObjectId(proId),
      quantity: 1
    }

    return new Promise(async (resolve, reject) => {
      let newlyadded = false;
      let userCart = await db.get().collection(collections.CART_COLLECTION).findOne({ user: new ObjectId(userId) })

      if (userCart) {



        let proExist = userCart.products.findIndex(product => product.item == proId)
        console.log(proExist)
        if (proExist != -1) {

          db.get().collection(collections.CART_COLLECTION).updateOne({ user: new ObjectId(userId), 'products.item': new ObjectId(proId) },
            {
              $inc: { 'products.$.quantity': 1 }
            }
          ).then((response) => {
            resolve(newlyadded)
          })


        }
        else {
          newlyadded = true;
          db.get().collection(collections.CART_COLLECTION).updateOne({ user: new ObjectId(userId) }, {

            $push: { products: proObj }

          }).then((response) => {
            resolve(newlyadded)
          })
        }
      }
      else {

        let cartObj = {
          user: new ObjectId(userId),
          products: [proObj]

        }

        db.get().collection(collections.CART_COLLECTION).insertOne(cartObj).then((response) => {
          resolve()
        })
      }

    })
  },
  getCartProduct: (userId) => {
    return new Promise(async (resolve, reject) => {
      let cartItems = await db.get().collection(collections.CART_COLLECTION).aggregate([
        {
          $match: { user: new ObjectId(userId) }

        },
        {
          $unwind: '$products'
        },
        {
          $project: {
            item: '$products.item',
            quantity: '$products.quantity'
          }
        }, {
          $lookup: {
            from: collections.PRODUCT_COLLECTION,
            localField: 'item',
            foreignField: '_id',
            as: 'product'

          }
        },
        {
          $project: {
            item: 1, quantity: 1, product: { $arrayElemAt: ['$product', 0] }
          }
        }


      ]).toArray()

      resolve(cartItems)


    })
  },
  getCartCount: (userId) => {

    let count = 0
    return new Promise(async (resolve, reject) => {
      let cart = await db.get().collection(collections.CART_COLLECTION).findOne({ user: new ObjectId(userId) })

      if (cart) {
        count = cart.products.length
        console.log(count)

      }
      resolve(count)
    })
  },
  changeProductQuantity: (details) => {

  details.quantity = parseInt(details.quantity)
    details.count = parseInt(details.count);


    return new Promise((resolve, reject) => {


      if (details.count == -1 && details.quantity == 1) {
        db.get().collection(collections.CART_COLLECTION).
          updateOne({ _id: new ObjectId(details.cart), 'products.item': new ObjectId(details.product) },
            {
              $pull: { products: { item: new ObjectId(details.product) } }
            }).then((response) => {
              resolve({ removeStatus: true })

            })
      } else {
        db.get().collection(collections.CART_COLLECTION).updateOne({ _id: new ObjectId(details.cart), 'products.item': new ObjectId(details.product) },
          {
            $inc: { 'products.$.quantity': details.count }
          }
        ).then((response) => {


          resolve({ removeStatus: false })
        })

      }


    }
    )
  },
  getTotalAmount: async (userId) => {
    let cart = await db.get().collection(collections.CART_COLLECTION).findOne({ user: new ObjectId(userId) })



    return new Promise(async (resolve, reject) => {
      let total = await db.get().collection(collections.CART_COLLECTION).aggregate([
        {
          $match: { user: new ObjectId(userId) }

        },
        {
          $unwind: '$products'
        },
        {
          $project: {
            item: '$products.item',
            quantity: '$products.quantity'
          }
        }, {
          $lookup: {
            from: collections.PRODUCT_COLLECTION,
            localField: 'item',
            foreignField: '_id',
            as: 'product'

          }
        },
        {
          $project: {
            item: 1, quantity: 1, product: { $arrayElemAt: ['$product', 0] }
          }
        },
        {
          $group: {
            _id: null,
            total: {
              $sum: {
                $multiply: [{ $toDouble: '$quantity' },
                { $toDouble: '$product.price' }]
              }
            }
          }

        }


      ]).toArray()
      
      
        resolve({ total: total[0].total, cartStatus: true })
      
      
        

    })

  }
  ,
  placeOrder: (order, products, total) => {
    return new Promise((resolve, reject) => {

      console.log(order, products, total)
      let status = order['payment-method'] == 'cod' ? 'placed' : 'pending'
      let orderObj = {
        deliveryDetails: {
          mobile: order.mobile,
          address: order.address,
          pincode: order.pincode

        },
        userId: new ObjectId(order.userId),
        paymentMethod: order['payment-method'],
        products: products,
        totalAmount: total,
        status: status,
        date: new Date()
      }
      db.get().collection(collections.ORDER_COLLECTION).insertOne(orderObj).then((response) => {
        db.get().collection(collections.CART_COLLECTION).deleteOne({ user: new ObjectId(order.userId) })
        resolve(orderObj)
      })
    })

  },
  getCartProductList: (userId) => {
    return new Promise(async (resolve, reject) => {
      let cart = await db.get().collection(collections.CART_COLLECTION).findOne({ user: new ObjectId(userId) })
      console.log(cart.products)
      resolve(cart.products)
    })
  },
  removeProduct: (details) => {

    return new Promise((resolve, reject) => {


      if (details.cart && details.product) {
        db.get().collection(collections.CART_COLLECTION).
          updateOne({ _id: new ObjectId(details.cart), 'products.item': new ObjectId(details.product) },
            {
              $pull: { products: { item: new ObjectId(details.product) } }
            }).then((response) => {
              resolve({ removeStatus: true })

            })
      }


    }
    )
  },
  getUserOrders: (userId) => {
    return new Promise(async (resolve, reject) => {
      console.log(userId)
      let orders = await db.get().collection(collections.ORDER_COLLECTION).find({ userId: new ObjectId(userId) }).toArray()

      resolve(orders)

    })
  },

  getOrderProducts: (orderId) => {
    console.log(orderId)
    return new Promise(async (resolve, reject) => {
      let orderItems = await db.get().collection(collections.ORDER_COLLECTION).aggregate([
        {
          $match: { _id: new ObjectId(orderId) }

        },
        {
          $unwind: '$products'
        },
        {
          $project: {
            item: '$products.item',
            quantity: '$products.quantity'
          }
        }, {
          $lookup: {
            from: collections.PRODUCT_COLLECTION,
            localField: 'item',
            foreignField: '_id',
            as: 'product'

          }
        },
        {
          $project: {
            item: 1, quantity: 1, product: { $arrayElemAt: ['$product', 0] }
          }
        }


      ]).toArray()

      resolve(orderItems)


    })
  }



}
