const express = require("express");
const path = require("path");
const fs = require("fs");

var Service;
var Characteristic;
var UUIDGen;

var expressApp;
var pluginName = "homebridge-http-watcher-switch";
var port = 3001;

module.exports = function(homebridge)
{

  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;
  UUIDGen = homebridge.hap.uuid;

  //Load configuration (if defined)
  var pluginConfigPath = path.join(homebridge.user.storagePath(), pluginName, "config.json");
  try
  {
    var pluginConfig = JSON.parse(fs.readFileSync(pluginConfigPath, "utf8"));
    if (pluginConfig.port) port = pluginConfig.port;
  }
  catch (err)
  {
    console.warn("Failed to open plugin configuration, default settings will be used!" , err);
  }

  console.log(`Starting HTTP listener on port ${port}...`);
  expressApp = express();
  expressApp.listen(port, (err) =>
  {
    if (err)
    {
      console.error(`Failed to start Express on port ${port}!`, err);
    }
    else
    {
      console.log(`Express is running on port ${port}.`)
    }
  });
  console.log("HTTP listener started.");
  
  homebridge.registerAccessory(pluginName, "HttpWatcherSwitch", HttpWatcherSwitch);
}

function HttpWatcherSwitch(log, config)
{
  this.log = log;
  this.name = config.name;

  expressApp.get(config["http-handler-path"], (request, response) =>
  {
    this.triggerSwitch();
    response.send(`Switch '${this.name}' triggered.`);
  });
}

HttpWatcherSwitch.prototype.identify = function()
{
  this.log(`identify called for ${this.name}`);
}

HttpWatcherSwitch.prototype.getServices = function()
{
  this.log(`getServices called for ${this.name}`);

  this.services = [];

  this.switchService = new Service.StatelessProgrammableSwitch(this.name);
  this.switchService.getCharacteristic(Characteristic.ProgrammableSwitchEvent)
                    .setProps({ maxValue: 0 });

  this.services.push(this.switchService);

  return this.services;
}

HttpWatcherSwitch.prototype.triggerSwitch = function()
{
  this.log("Triggering switch...");

  var char = this.switchService.getCharacteristic(Characteristic.ProgrammableSwitchEvent);
  char.setValue(Characteristic.ProgrammableSwitchEvent.SINGLE_PRESS);
}