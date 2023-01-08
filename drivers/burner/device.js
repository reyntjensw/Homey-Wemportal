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

    generator(ModuleIndex, ModuleType, ParameterID) {
        return { "ModuleIndex": ModuleIndex, "ModuleType": ModuleType, "Parameters": [{ "ParameterID": ParameterID }] }
    }


    async getProductionData() {
        try {
            let username = this.homey.settings.get('username');
            let password = this.homey.settings.get('password');
            this.wemApi = new WemApi(username, password);

            await this.wemApi.initializeSession();
            const indoorTemperature = this.wemApi.getIndoorTemperature(this.getData().id);
            const [indoorObj] = await Promise.all([indoorTemperature]);
            this.setStoreValue("ModuleIndex", indoorObj.ModuleIndex);

            if (indoorObj["NumericValue"] != "undefined" && typeof indoorObj["NumericValue"] == 'number' && !isNaN(indoorObj["NumericValue"])) {
                this.setCapabilityValue('measure_temperature', indoorObj["NumericValue"]).catch(this.error);
            } else {
                this.setCapabilityValue('measure_temperature', 0).catch(this.error);
            }

            const outdoorTemperature = this.generator(0, 1, "Außentemperatur");
            const normalTemperature = this.generator(indoorObj.ModuleIndex, 2, "Normal");
            const comfortTemperature = this.generator(indoorObj.ModuleIndex, 2, "Komfort");
            const decreasedTemperature = this.generator(indoorObj.ModuleIndex, 2, "Absenk");
            const currentMode = this.generator(indoorObj.ModuleIndex, 2, "Betriebsart");

            const dataArray = [];
            dataArray.push(normalTemperature, comfortTemperature, decreasedTemperature, currentMode)

            const outputIndoor = await this.wemApi.queryApiIndoor(this.getData().id, dataArray);
            const outputOutdoor = await this.wemApi.queryApiOutdoor(this.getData().id, [outdoorTemperature]);
            console.log("outputIndoor")
            console.log(outputIndoor)
            console.log("outputOutdoor")
            console.log(outputOutdoor)

            await this.setCapabilityValue('measure_temperature.outside', outputOutdoor["outdoor"]).catch(this.error);
            await this.setCapabilityValue('measure_temperature.normal', outputIndoor["normal"]).catch(this.error);
            await this.setCapabilityValue('measure_temperature.comfort', outputIndoor["comfort"]).catch(this.error);
            await this.setCapabilityValue('measure_temperature.decreased', outputIndoor["decreased"]).catch(this.error);
            await this.setCapabilityValue('thermostat_mode', outputIndoor["currentMode"]).catch(this.error);

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
