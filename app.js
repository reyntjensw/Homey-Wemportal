'use strict';

const Homey = require('homey');



class WemPortal extends Homey.App {

    /**
     * onInit is called when the app is initialized.
     */
    async onInit() {
        this.log('WemPortal has been initialized');
    }

}

module.exports = WemPortal;
