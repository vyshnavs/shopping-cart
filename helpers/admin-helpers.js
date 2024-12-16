var db = require('../config/connection');
var collections = require('../config/collections');
const bcrypt = require('bcrypt');

const ObjectId = require('mongodb').ObjectId;
module.exports={
    doSignup: (adminData) => {
        return new Promise(async (resolve, reject) => {
          //to encrypt the password
          adminData.password = await bcrypt.hash(adminData.password, 10)
          const collectionName = 'admins';
    
          try {
            // Connect to the database
            const database = await db.connect();
    
            // Get the collection
            const collection = database.collection(collectionName);
    
            // Create a document to insert
            const admin = {
              name: adminData.name,
              email:adminData.email,
              password: adminData.password,
    
            };
    
            // Insert the user into the collection
            const result = await collection.insertOne(admin);
    
    
            console.log("admin inserted successfully:", admin);
    
            id = result.insertedId;
            resolve(adminData)
    
          } catch (error) {
            console.error("Failed to insert user:", error);
            // Handle the error and render an error page or send an error response
            res.status(500).send("Failed to add user. Please try again later.");
          }
    
        })
      },
      doLogin: (adminData) => {
        return new Promise(async (resolve, reject) => {
         
          let response = {};
          //take data from database
          let admin = await db.get().collection(collections.ADMIN_COLLECTION).findOne({ email: adminData.email });
    
          if (admin) {
            //comparing the passwords.Bcrypt has internal promise function.
            bcrypt.compare(adminData.password, admin.password).then((status) => {
    
              if (status) {
                console.log('admin login success');

                response.admin =admin;
                response.status = true;
                resolve(response);
                
              }
              else {
                console.log('login failed');
                resolve({ status: false });
    
              }
            })
          }
          
        })
      },
   addTrending:async(trendingInsert,callback)=>{
        console.log(trendingInsert);

        
  // Define the collection name
  const collectionName = 'trendings';

  try {
    // Connect to the database
    const database = await db.connect();
    
    // Get the collection
    const collection = database.collection(collectionName);

    // Create a document to insert
    const trending = {
      name:trendingInsert.Name,
      category:trendingInsert.Category,
      price:trendingInsert.Price,
      description:trendingInsert.Description,
      
    };

    // Insert the product into the collection
    const result = await collection.insertOne(trending);


    console.log("Trending inserted successfully:",trending);
    
    id=result.insertedId;
    callback(id);
    
  } catch (error) {
    console.error("Failed to insert trending:", error);
    // Handle the error and render an error page or send an error response
    res.status(500).send("Failed to add trending. Please try again later.");
  }
    },
    getAllTrendings:()=>{
      return new Promise(async(resolve,reject)=>{

        let trendings=await db.get().collection(collections.TRENDING_COLLECTION).find().toArray()
          
      
        resolve(trendings)
        
       
      })
},
getAllUsers:()=>{
  return new Promise(async(resolve,reject)=>{
    let users=await db.get().collection(collections.USER_COLLECTION).find().toArray()
    resolve(users)
   })
},
getAllOrders:()=>{
  return new Promise((resolve,reject)=>{
    let orders=db.get().collection(collections.ORDER_COLLECTION).find().toArray()
    resolve(orders)
  })
}
}