'use strict';

const { Driver } = require('homey');
const { WemApi } = require('./wemapi');


class Burner extends Driver {

    /**
     * onInit is called when the driver is initialized.
     */
    async onInit() {
        this.log('Burner has been initialized');
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

                wemApi = new WemApi(data.username, data.password);
                await wemApi.initializeSession();

                return true;
            } catch (error) {
                this.error(error);
            }
        });

        session.setHandler('list_devices', async (data) => {
            try {
                wemApi = new WemApi(username, password);
                const systems = await wemApi.getSystems();

                const devices = systems.map(item => ({
                    name: item.Name,
                    data: {
                        id: item.ID,
                    },
                }));
                console.debug(devices);

                return devices;
            } catch (error) {
                this.error(error);
            }
        });

    }

}

module.exports = Burner;
