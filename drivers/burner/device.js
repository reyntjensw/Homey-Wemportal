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
        }, 300000);

    }


    async getProductionData() {
        try {
            let username = this.homey.settings.get('username');
            let password = this.homey.settings.get('password');
            this.wemApi = new WemApi(username, password);
            await this.wemApi.initializeSession();
            let temperature = await this.wemApi.getIndoorTemperature(this.getData().id)
            this.setCapabilityValue('measure_temperature', temperature.NumericValue).catch(this.error);
            let outsideTemperature = await this.wemApi.getOutsideTemperature(this.getData().id)
            this.setCapabilityValue('measure_temperature.outside', outsideTemperature.NumericValue).catch(this.error);
            // this.setUnavailable();
        } catch (e) {
            this.log(e);

        }
    }

}

module.exports = Burner;
