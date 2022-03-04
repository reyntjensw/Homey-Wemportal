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
        // if (this.hasCapability('measure_temperature.comfort') === false) {
        //     await this.addCapability('measure_temperature.comfort');
        // }
        // if (this.hasCapability('measure_temperature.normal') === false) {
        //     await this.addCapability('measure_temperature.normal');
        // }
        // if (this.hasCapability('measure_temperature.decrease') === false) {
        //     await this.addCapability('measure_temperature.decrease');
        // }
        // first time fill up the data
        this.getProductionData();

        this.homey.setInterval(async () => {
            await this.getProductionData();
        }, 1000 * 60 * 5);

    }


    async getProductionData() {
        try {
            let username = this.homey.settings.get('username');
            let password = this.homey.settings.get('password');
            this.wemApi = new WemApi(username, password);

            await this.wemApi.initializeSession();
            const indoorTemperature = this.wemApi.getIndoorTemperature(this.getData().id);
            const [indoorObj] = await Promise.all([indoorTemperature]);

            this.setCapabilityValue('measure_temperature', indoorObj.NumericValue).catch(this.error);
            this.log("inside temp");
            this.log(indoorObj);
            // #indoorObj.ModuleIndex


            const outdoorTemperature = this.wemApi.queryApi(this.getData().id, 0, 1, "Außentemperatur");
            const normalTemperature = this.wemApi.queryApi(this.getData().id, indoorObj.ModuleIndex, 2, "Normal");
            const comfortTemperature = this.wemApi.queryApi(this.getData().id, indoorObj.ModuleIndex, 2, "Komfort");
            const decreasedTemperature = this.wemApi.queryApi(this.getData().id, indoorObj.ModuleIndex, 2, "Absenk");
            const currentMode = this.wemApi.queryApi(this.getData().id, indoorObj.ModuleIndex, 2, "Betriebsart");
            const [outdoorObj, normalObj, comfortObj, decreasedObj, currentModeObj] = await Promise.all([outdoorTemperature, normalTemperature, comfortTemperature, decreasedTemperature, currentMode]);
            this.log("outdoor temp");
            this.log(outdoorObj);

            this.setCapabilityValue('measure_temperature.outside', outdoorObj.NumericValue).catch(this.error);
            this.setCapabilityValue('measure_temperature.normal', normalObj.NumericValue).catch(this.error);
            this.setCapabilityValue('measure_temperature.comfort', comfortObj.NumericValue).catch(this.error);
            this.setCapabilityValue('measure_temperature.decreased', decreasedObj.NumericValue).catch(this.error);
            this.setCapabilityValue('thermostat_mode', currentModeObj.StringValue).catch(this.error);

        } catch (e) {
            this.log(e);

        }
    }

}

module.exports = Burner;
