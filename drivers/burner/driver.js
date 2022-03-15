'use strict';

const { Driver } = require('homey');
const { WemApi } = require('./wemapi');


class Burner extends Driver {

    /**
     * onInit is called when the driver is initialized.
     */
    async onInit() {
        this.log('Burner has been initialized');
        try {
            const cardActionSetTemperature = this.homey.flow.getActionCard("set-temperature");
            cardActionSetTemperature.registerRunListener(async (args) => {
                await args.device.writeSettings(args.device.getData().id, args.device.getStoreValue("ModuleIndex"), 2, args.ParameterID, args.temperature);
            })
        } catch (error) {
            throw new error(error);
        }

        try {
            const cardActionSetSystemMode = this.homey.flow.getActionCard("set-system-mode");
            cardActionSetSystemMode.registerRunListener(async (args) => {
                await args.device.writeSettings(args.device.getData().id, args.device.getStoreValue("ModuleIndex"), 2, "Betriebsart", args.systemMode);
            })
        } catch (error) {
            throw new error(error);
        }
    }

    onPair(session) {
        let username;
        let password;
        let wemApi;
        let systems;

        session.setHandler('login', async (data) => {
            try {
                this.homey.settings.set('username', data.username);
                this.homey.settings.set('password', data.password);
                username = data.username;
                password = data.password;


                wemApi = new WemApi(username, password);
                await wemApi.initializeSession();

                return true;
            } catch (error) {
                this.error(error);
            }
        });

        session.setHandler('list_devices', async (data) => {
            try {
                const systems = await wemApi.getSystems();
                const devices = systems.map(item => ({
                    name: item.Name,
                    data: {
                        id: item.ID
                    },
                }));

                return devices;
            } catch (error) {
                this.error(error);
            }
        });

    }

}

module.exports = Burner;
