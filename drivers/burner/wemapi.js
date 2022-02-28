const fetch = require('node-fetch');
const { URLSearchParams } = require('url');


const baseUrl = 'https://www.wemportal.com/app';
let cookie = '';
global.ModuleIndex = null;

class WemApi {
    constructor(username, password) {
        this.username = username;
        this.password = password;
    }

    async initializeSession() {
        const accountUrl = `${baseUrl}/Account/Login`;
        console.log("begin");
        const requestBody = JSON.stringify({
            "Name": this.username,
            "PasswordUTF8": this.password,
            "AppID": "de.weishaupt.wemapp",
            "AppVersion": "2.0.2",
            "ClientOS": "Android"
        });
        const apiData = await this.apiRequest(accountUrl, 'POST', requestBody);
    }

    async apiRequest(url, methodContent, requestBody) {
        const apiResponse = await fetch(url, {
            method: methodContent,
            headers: {
                'Content-Type': 'application/json',
                "User-Agent": "WeishauptWEMApp",
                "X-Api-Version": "2.0.0.0",
                "Accept": "*/*"
            },
            body: requestBody,
        });

        const apiData = await apiResponse;
        console.log(apiData.headers.get('set-cookie').split(";")[0]);
        cookie = apiData.headers.get('set-cookie').split(";")[0];

        if (apiData.statusText === 'OK') {
            return apiData;

        }

        throw new Error(apiData.status);
    }

    async getSystems() {
        const systemsUrl = `${baseUrl}/Device/Read`;
        console.log("next");
        const response = await fetch(systemsUrl, {
            headers: {
                'Content-Type': 'application/json',
                "User-Agent": "WeishauptWEMApp",
                "X-Api-Version": "2.0.0.0",
                "Accept": "*/*",
                "Cookie": cookie
            }
        });
        const apiData = await response.json();

        return apiData["Devices"];
    }

    async getSystems() {
        const systemsUrl = `${baseUrl}/Device/Read`;
        console.log("next");
        const response = await fetch(systemsUrl, {
            headers: {
                'Content-Type': 'application/json',
                "User-Agent": "WeishauptWEMApp",
                "X-Api-Version": "2.0.0.0",
                "Accept": "*/*",
                "Cookie": cookie
            }
        });
        const apiData = await response.json();

        return apiData["Devices"];
    }

    async getIndoorTemperature(ID) {
        const systemsUrl = `${baseUrl}/DataAccess/Read`;
        let bodyData = "";
        bodyData = JSON.stringify({
            "DeviceID": ID,
            "Modules": [
                {
                    "ModuleIndex": 0,
                    "ModuleType": 2,
                    "Parameters": [
                        {
                            "ParameterID": "Raumtemperatur"
                        }
                    ]
                },
                {
                    "ModuleIndex": 1,
                    "ModuleType": 2,
                    "Parameters": [
                        {
                            "ParameterID": "Raumtemperatur"
                        }
                    ]
                }
            ]
        });
        const response = await fetch(systemsUrl, {
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
                "User-Agent": "WeishauptWEMApp",
                "X-Api-Version": "2.0.0.0",
                "Accept": "*/*",
                "Cookie": cookie
            },
            body: bodyData
        });

        const apiData = await response.json();
        for (let i = 0; i < apiData["Modules"].length; i++) {
            if (apiData["Modules"][i]["Values"][0]["NumericValue"] != null) {
                ModuleIndex = apiData["Modules"][i]["ModuleIndex"];
                return apiData["Modules"][i]["Values"][0]
            }
        }
    }

    async getOutsideTemperature(ID) {
        const systemsUrl = `${baseUrl}/DataAccess/Read`;
        let bodyData = "";

        bodyData = JSON.stringify({
            "DeviceID": ID,
            "Modules": [
                {
                    "ModuleIndex": 0,
                    "ModuleType": 1,
                    "Parameters": [
                        {
                            "ParameterID": "Außentemperatur"
                        }
                    ]
                },
                {
                    "ModuleIndex": 1,
                    "ModuleType": 1,
                    "Parameters": [
                        {
                            "ParameterID": "Außentemperatur"
                        }
                    ]
                }
            ]
        });

        const response = await fetch(systemsUrl, {
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
                "User-Agent": "WeishauptWEMApp",
                "X-Api-Version": "2.0.0.0",
                "Accept": "*/*",
                "Cookie": cookie
            },
            body: bodyData
        });

        const apiData = await response.json();
        for (let i = 0; i < apiData["Modules"].length; i++) {
            console.log(apiData["Modules"][i]["Values"][0]["NumericValue"]);
            if (apiData["Modules"][i]["Values"][0]["NumericValue"] != null) {
                return apiData["Modules"][i]["Values"][0]
            }
        }
    }

}

module.exports = { WemApi };
