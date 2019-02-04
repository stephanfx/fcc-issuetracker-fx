/*
*
*
*       Complete the API routing below
*
*
*/

'use strict';

var expect = require('chai').expect;
var MongoClient = require('mongodb').MongoClient;
var ObjectId = require('mongodb').ObjectID;

const CONNECTION_STRING = process.env.DB; //MongoClient.connect(CONNECTION_STRING, function(err, db) {});

module.exports = function (app) {
  
    app.route('/api/issues/:project')

      .get(function (req, res){
        var project = req.params.project;
        var query = Object.assign({ project }, req.query);  
        
        // cast boolean open field
        if (query.open) {
           query.open = query.open == 'true'; 
        }
        
        MongoClient.connect(CONNECTION_STRING, (err, db) => {
          if (err) {
            console.log('DB Connection Error: ', err);
          }
          
          db.collection('issues').find(query, (err, docs) => {
            if (err) {
              return res.send('Error getting from to DB: ', err);
            }
            docs.toArray().then(results => {
              res.json(results);
              db.close();
            });  
          });          
        });        
      })

      .post(function (req, res){
        var project = req.params.project;
        
        var { issue_title, issue_text, created_by, status_text, assigned_to } = req.body;
        if (!issue_title || !issue_text || !created_by) {
          return res.status(400).json('Not all required fields supplied');    
        }
      
        // blank the optional fields if it was not supplied
        status_text = status_text ? status_text : '';
        assigned_to = assigned_to ? assigned_to : '';
      
        MongoClient.connect(CONNECTION_STRING, (err, db) => {
          if (err) {
            console.log('DB Connection Error: ', err);
          }
          
          db.collection('issues').insertOne({
            issue_title,
            issue_text,
            created_by,
            assigned_to,
            status_text,
            created_on: new Date(),
            updated_on: new Date(),
            project,
            open: true,
          }, (err, doc) => {
             if (err) {
              return res.send('Error saving to DB: ', err);
             }
            res.json(doc.ops[0]);
          });
          db.close();
        });
      })

      .put(function (req, res){
        var project = req.params.project;
        var _id = req.body._id;
              
        if (!_id) {
          return res.status(400).json('no _id specified');
        }
      
        var updateData = req.body;
        delete(updateData._id);
        
        if (Object.keys(updateData).length == 0) {          
          return res.status(400).json('no updated field sent');
        }
        
        if (updateData.open) {
          updateData.open = updateData.open == 'true';
        }
        
        MongoClient.connect(CONNECTION_STRING, (err, db) => {
          if (err) {
            console.log('DB Connection Error: ', err);
          }   
          updateData.updated_on = new Date();
          
          db.collection('issues').updateOne({_id: ObjectId(_id)}, {'$set':updateData}, (err, doc) => {
             if (err) {
              return res.json('could not update ' + _id);
             }
              res.json('successfully updated');
          });
          db.close();
        });        
      })

      .delete(function (req, res){
        var project = req.params.project;
        
        var _id = req.body._id;
      
        if (!_id){
           return res.json('_id error'); 
        }
        
        MongoClient.connect(CONNECTION_STRING, (err, db) => {
          if (err) {
            console.log('DB Connection Error: ', err);
          }   
          
          db.collection('issues').deleteOne({_id: ObjectId(_id)}, (err, doc) => {
             if (err) {
              return res.json('could not delete ' + _id);
             }
              res.json('deleted ' + _id);
          });
          db.close();
        });  
      });   
};
