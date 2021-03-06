

const debug = require('debug')('api:remove-simulation');

const fs = require('fs');
const util = require('util');
const rmdir = util.promisify(require('rimraf'));

const mongoose = require('mongoose');
const rmDirRemote = require('./rmdir-remote');

const { getSimulations } = require('../../../globals');

const mongooseUtils = require('../../../main/dbms/mongo-utils');
const { cloudService } = require('../../../main/service');

const {
  saltPath: {
    output,
    data,
  },
} = require('../../../config');

/**
 * remove simulation by id
 * 1. remove local file system
 * 2. remove db
 * 3. remove remote master
 * 4. remove remote workers
 *
 * @param {String} id
 */
async function removeSimulation(id) {
  // if (mongoose.connection.readyState !== 1) {
  //   throw new Error('Cannot delete simulation, Simulation Database not connected');
  // }
  if(!mongooseUtils.isConnected()) {
    throw new Error('Cannot delete simulation, Simulation Database not connected');
  }
  const simulation = getSimulations().find({ id }).value();

  if (!simulation) {
    debug(`simulation(${id} does not exists`);
    throw new Error(`simulation(${id}) not exists...`);
  }

  const targetDirOutput = `${output}/${id}`;
  const targetDirData = `${data}/${id}`;

  try {
    await getSimulations().remove({ id }).write();
    if (fs.existsSync(targetDirData)) {
      await rmdir(targetDirData);
    }
    if (fs.existsSync(targetDirOutput)) {
      await rmdir(targetDirOutput);
    }

    try {
      await mongooseUtils.dropCollection('simulation_results', id);
    } catch (err) {
      // ignore
    }
  } catch (err) {
    throw err;
  }

  // const vmInfo = await cloudService.getVmInfo(simulation.user);
  // if (!vmInfo) {
    // throw new Error('vm not exists');
    // debug('vm not exists');
    // return;
  // }

  // const {
  //   host, username, privateKey, port, workers,
  // } = vmInfo;

  // try {
  //   debug(`remove dir ${host} ${targetDirOutput}`);
  //   const masterInfo = {
  //     host,
  //     username,
  //     privateKey,
  //     port,
  //   };
    // await rmDirRemote(masterInfo, targetDirOutput);
    // await rmDirRemote(masterInfo, targetDirData);

    /* eslint no-restricted-syntax:0 */
    /* eslint no-await-in-loop:0 */
    // for (const ip of workers) {
    //   debug(`remove dir ${ip} ${targetDirOutput}`);
    //   const conInfo = {
    //     host: ip,
    //     username,
    //     privateKey,
    //   };
    //   await rmDirRemote(conInfo, targetDirOutput);
    //   await rmDirRemote(conInfo, targetDirData);
    // }
  // } catch (err) {
  //   debug(err.message);
  // }
}

module.exports = removeSimulation;
