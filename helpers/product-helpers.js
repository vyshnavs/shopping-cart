var db = require('../config/connection'); 
var collections=require('../config/collections');
const { response } = require('../app');
const  ObjectId = require('mongodb').ObjectId;
module.exports={

    addProduct:async(productInsert,callback)=>{
        console.log(productInsert);

        
  // Define the collection name
  const collectionName = 'products';

  try {
    // Connect to the database
    const database = await db.connect();

    // Get the collection
    const collection = database.collection(collectionName);

    // Create a document to insert
    const product = {
      name:productInsert.Name,
      category:productInsert.Category,
      price:productInsert.Price,
      description:productInsert.Description,
      
    };

    // Insert the product into the collection
    const result = await collection.insertOne(product);


    console.log("Product inserted successfully:",product);
    
    id=result.insertedId;
    callback(id);
    
  } catch (error) {
    console.error("Failed to insert product:", error);
    // Handle the error and render an error page or send an error response
    res.status(500).send("Failed to add product. Please try again later.");
  }
    },

    getSelectionAllProducts:()=>{
      return new Promise(async(resolve,reject)=>{

        let products=await db.get().collection(collections.PRODUCT_COLLECTION).find().toArray()
          
      
        resolve(products)
        
       
      })

    },
    deleteProduct: (prodId) => {
      return new Promise((resolve, reject) => {
        console.log("Received prodId:", prodId);
        
        // Validate the ObjectId
        if (!ObjectId.isValid(prodId)) {
          return reject(new Error('Invalid product ID'));
        }
        
        const objId = new ObjectId(prodId);
        db.get().collection(collections.PRODUCT_COLLECTION).deleteOne({ _id: objId })
          .then((response) => {
            console.log(response);
            resolve(response);
          })
          .catch((err) => {
            console.error(err);
            reject(err);
          });
      })
     
    },
    getProductDetails:(prodId)=>{
      return new Promise((resolve,reject)=>{
        db.get().collection(collections.PRODUCT_COLLECTION).findOne({_id:new ObjectId(prodId)}).then((product)=>{
          resolve(product)
        })
      })

    },
    updateProduct:(proId,proDetails)=>{
      return new Promise(async(resolve,reject)=>{
        console.log(proDetails)
       await db.get().collection(collections.PRODUCT_COLLECTION).updateOne({_id:new ObjectId(proId)},{
          $set:{
            name:proDetails.Name,
            description:proDetails.Description,
            category:proDetails.Category
  
          }
        }).then((response)=>{
          resolve()
        })
      })
     
      
    }
    
}