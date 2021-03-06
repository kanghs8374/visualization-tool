const mongoose = require('mongoose');
const findFeatures = require('./find-features');
// const mongoose = require('../../main/dbms/mongo');
const parseMapReqParam = require('../../utils/parse-req-query');

module.exports = async (req, res) => {
  // console.log('********************** links **********************');
  const { extent } = parseMapReqParam(req);
  // const collection = mongoose.connection.db.collection('links');
  const collection = mongoose.connection.db.collection('ulinks');
  const links = await findFeatures(collection, {
    extent,
    zoom: 17,
  });
  res.json({ features: links });
};
