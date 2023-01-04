'use strict';
const { Device } = require('homey');
const { WemApi } = require('./wemapi');


class Burner extends Device {

    /**
     * onInit is called when the device is initialized.
     */
    async onInit() {
        this.log('Burner has been initialized');

        if (this.hasCapability('measure_temperature.outside') === false) {
            await this.addCapability('measure_temperature.outside');
        }
        if (this.hasCapability('measure_temperature.comfort') === false) {
            await this.addCapability('measure_temperature.comfort');
        }
        if (this.hasCapability('measure_temperature.normal') === false) {
            await this.addCapability('measure_temperature.normal');
        }
        if (this.hasCapability('measure_temperature.decreased') === false) {
            await this.addCapability('measure_temperature.decreased');
        }
        if (this.hasCapability('thermostat_mode') === false) {
            await this.addCapability('thermostat_mode');
        }

        // first time fill up the data
        this.getProductionData();

        this.homey.setInterval(async () => {
            await this.getProductionData();
        }, 1000 * 60 * 3);

    }


    async getProductionData() {
        try {
            let username = this.homey.settings.get('username');
            let password = this.homey.settings.get('password');
            this.wemApi = new WemApi(username, password);

            await this.wemApi.initializeSession();
            const indoorTemperature = this.wemApi.getIndoorTemperature(this.getData().id);
            const [indoorObj] = await Promise.all([indoorTemperature]);
            // this.setData(indoorObj.ModuleIndex);
            this.setStoreValue("ModuleIndex", indoorObj.ModuleIndex);
            console.log("indoorObj")
            console.log(indoorObj)

            this.setCapabilityValue('measure_temperature', 0).catch(this.error);
            if (indoorObj["NumericValue"] != "undefined") {
                this.setCapabilityValue('measure_temperature', indoorObj["NumericValue"]).catch(this.error);
            }

            // const outdoorTemperature = this.wemApi.generator(0, 1, "Außentemperatur");
            // const normalTemperature = this.wemApi.generator(indoorObj.ModuleIndex, 2, "Normal");
            // const comfortTemperature = this.wemApi.generator(indoorObj.ModuleIndex, 2, "Komfort");
            // const decreasedTemperature = this.wemApi.generator(indoorObj.ModuleIndex, 2, "Absenk");
            // const currentMode = this.wemApi.generator(indoorObj.ModuleIndex, 2, "Betriebsart");

            // const dataArray = [];
            // dataArray.push(outdoorTemperature, normalTemperature, comfortTemperature, decreasedTemperature, currentMode)

            const output = await this.wemApi.queryApi(this.getData().id, [{ "ModuleIndex": indoorObj.ModuleIndex, "ModuleType": 2, "Parameters": [{ "ParameterID": "Normal" }] }, { "ModuleIndex": indoorObj.ModuleIndex, "ModuleType": 2, "Parameters": [{ "ParameterID": "Komfort" }] }, { "ModuleIndex": indoorObj.ModuleIndex, "ModuleType": 2, "Parameters": [{ "ParameterID": "Absenk" }] }, { "ModuleIndex": indoorObj.ModuleIndex, "ModuleType": 2, "Parameters": [{ "ParameterID": "Betriebsart" }] }]);
            console.log(output)
            // const [outdoorObj, normalObj, comfortObj, decreasedObj, currentModeObj] = await Promise.all([outdoorTemperature, normalTemperature, comfortTemperature, decreasedTemperature, currentMode]);
            // const [currentModeObj, comfortObj, normalObj, decreasedObj, outdoorObj] = await Promise.all(output);

            // console.log(output["comfort"])

            // await this.setCapabilityValue('measure_temperature.outside', outdoorObj.NumericValue).catch(this.error);
            await this.setCapabilityValue('measure_temperature.normal', output["normal"]).catch(this.error);
            await this.setCapabilityValue('measure_temperature.comfort', output["comfort"]).catch(this.error);
            await this.setCapabilityValue('measure_temperature.decreased', output["decreased"]).catch(this.error);
            await this.setCapabilityValue('thermostat_mode', output["currentMode"]).catch(this.error);

            // await this.wemApi.setTemperature(this.getData().id, indoorObj.ModuleIndex, 2, "Komfort", 19.5);

            if (!this.getAvailable()) {
                await this.setAvailable();
            }

        } catch (error) {
            this.error(`Unavailable (${error})`);
            this.setUnavailable(`Error retrieving data (${error})`);

        }
    }

    async writeSettings(ID, ModuleIndex, ModuleType, ParameterID, newValue) {
        try {
            let username = this.homey.settings.get('username');
            let password = this.homey.settings.get('password');
            this.wemApi = new WemApi(username, password);

            await this.wemApi.initializeSession();
            await this.wemApi.writeSettings(ID, ModuleIndex, ModuleType, ParameterID, newValue);
        } catch (error) {
            this.error(`Unavailable (${error})`);

        }
    }

}

module.exports = Burner;
